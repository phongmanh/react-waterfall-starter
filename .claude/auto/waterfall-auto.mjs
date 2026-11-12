#!/usr/bin/env node
// Waterfall autopilot: runs the react-waterfall skill unattended.
// Each unit of work gets its own fresh headless session (`claude -p`). A session ends by
// rewriting STATUS.md's "## Handoff"; the next session starts from it through the
// SessionStart hook. The loop stops when the project is done, needs the user, or hits a limit.
// Options: .claude/auto/config.json (see --help).
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createInterface } from 'node:readline'
import { STATUS_PATH, loadHandoff, loadStatus } from '../hooks/lib/status.mjs'
import { EXIT, HELP, buildClaudeArgs, buildPrompt, decide, loadConfig, parseArgs, parseWaiting, renderEvent } from './lib.mjs'

const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd()
const say = (msg = '') => process.stdout.write(`${msg}\n`)
const pad = (n) => String(n).padStart(2, '0')

function localDate(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function git(...args) {
  const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8' })
  return r.status === 0 ? r.stdout : ''
}

/** Changes whenever a session moved the project: STATUS.md, a commit, or the working tree. */
function fingerprint() {
  const h = createHash('sha1')
  try {
    h.update(readFileSync(path.join(dir, STATUS_PATH)))
  } catch {
    h.update('no-status')
  }
  h.update(git('rev-parse', 'HEAD')).update(git('status', '--porcelain')).update(git('diff'))
  return h.digest('hex')
}

function saveBrief(cfg, text) {
  if (loadStatus(dir)) throw new Error('A project already exists here, so the brief is fixed. Change scope with /change-request instead.')
  const file = path.join(dir, cfg.brief)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, `# Project brief\n\n${text.trim()}\n`)
  say(`Brief saved to ${cfg.brief}`)
}

let child = null
let interrupted = false
process.on('SIGINT', () => {
  interrupted = true
  if (child) child.kill('SIGINT')
  else process.exit(130)
})

function runSession({ cfg, prompt, logFile, budgetLeft }) {
  return new Promise((resolve) => {
    const log = createWriteStream(logFile)
    let result = null
    let timedOut = false
    child = spawn(cfg.claudeBin, buildClaudeArgs({ cfg, prompt, budgetLeft }), {
      cwd: dir,
      env: { ...process.env, CLAUDE_PROJECT_DIR: dir, WATERFALL_AUTO: '1' },
      stdio: ['ignore', 'pipe', 'inherit'],
    })
    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
    }, cfg.sessionTimeoutMinutes * 60_000)

    createInterface({ input: child.stdout }).on('line', (line) => {
      log.write(`${line}\n`)
      const ev = renderEvent(line)
      if (ev.result) result = ev.result
      if (ev.text && !cfg.quiet) say(ev.text)
    })
    const done = (code, error) => {
      clearTimeout(timer)
      child = null
      log.end()
      resolve({ code, error, timedOut, result })
    }
    child.on('error', (err) => done(1, err.message))
    child.on('close', (code) => done(code ?? 1))
  })
}

async function main() {
  const { overrides, flags, positional } = parseArgs(process.argv.slice(2))
  if (flags.help) return say(HELP)
  const cfg = loadConfig(dir, overrides)
  if (flags.once) cfg.maxSessions = 1
  // A dry run writes nothing: it only pretends the brief was saved.
  if (positional.length && !flags.dryRun) saveBrief(cfg, positional.join(' '))

  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)
  let totalCost = 0
  let stalls = 0
  let failures = 0
  let ran = 0

  const finish = (code, reason) => {
    say(`\n■ Autopilot stopped: ${reason}`)
    if (ran) say(`  ${ran} session${ran === 1 ? '' : 's'}, $${totalCost.toFixed(2)}. Logs: ${cfg.logDir}/${stamp}-*.jsonl`)
    process.exit(code)
  }

  for (let session = 1; ; session++) {
    const status = loadStatus(dir)
    const unblock = flags.unblock && session === 1
    const verdict = decide({ status, handoff: loadHandoff(dir), cfg, briefExists: existsSync(path.join(dir, cfg.brief)) || (flags.dryRun && positional.length > 0), unblock })
    if (verdict.action === 'stop') finish(verdict.code, verdict.reason)
    if (session > cfg.maxSessions) finish(EXIT.limit, `reached maxSessions (${cfg.maxSessions}). Run it again to continue.`)
    const budgetLeft = cfg.maxBudgetUsd === null ? null : cfg.maxBudgetUsd - totalCost
    if (budgetLeft !== null && budgetLeft <= 0) finish(EXIT.limit, `reached maxBudgetUsd ($${cfg.maxBudgetUsd}).`)

    const prompt = buildPrompt({ cfg, status, session, today: localDate(), unblock })
    if (flags.dryRun) {
      const shown = buildClaudeArgs({ cfg, prompt: '<prompt>', budgetLeft })
      say(`Dry run. The next session would run:\n\n  ${cfg.claudeBin} ${shown.map((a) => (/[\s()*]/.test(a) ? `'${a}'` : a)).join(' ')}\n\n--- prompt ---\n${prompt}`)
      return
    }

    mkdirSync(path.join(dir, cfg.logDir), { recursive: true })
    const logFile = path.join(dir, cfg.logDir, `${stamp}-session-${pad(session)}.jsonl`)
    say(`\n▶ Session ${session}/${cfg.maxSessions} · ${status?.currentPhase || 'new project'}`)
    const before = fingerprint()
    const started = Date.now()
    const res = await runSession({ cfg, prompt, logFile, budgetLeft })
    ran++
    totalCost += res.result?.costUsd ?? 0
    const mins = ((Date.now() - started) / 60_000).toFixed(1)
    const failed = Boolean(res.error) || res.code !== 0 || res.timedOut || !res.result || res.result.isError
    say(`◀ Session ${session} ${failed ? 'FAILED' : 'done'} · ${mins} min · ${res.result?.turns ?? '?'} turns · $${(res.result?.costUsd ?? 0).toFixed(2)} (run total $${totalCost.toFixed(2)})`)
    if (res.result?.summary && cfg.quiet) say(res.result.summary)

    if (interrupted) finish(130, 'interrupted. The next run continues from the handoff.')
    if (res.error) finish(EXIT.error, `could not start "${cfg.claudeBin}": ${res.error}`)

    if (failed) {
      const why = res.timedOut ? `timed out after ${cfg.sessionTimeoutMinutes} min` : `exit code ${res.code}${res.result?.summary ? `: ${res.result.summary.slice(0, 300)}` : ''}`
      say(`  Session failed (${why}).`)
      if (++failures >= cfg.maxFailures) finish(EXIT.error, `${failures} sessions failed in a row. See ${path.relative(dir, logFile)}.`)
    } else failures = 0

    if (fingerprint() === before) {
      if (++stalls >= cfg.maxStalls) finish(EXIT.stalled, `${stalls} sessions in a row changed nothing. See ${path.relative(dir, logFile)}.`)
    } else stalls = 0

    const waiting = parseWaiting(loadHandoff(dir))
    if (waiting.blocked) finish(EXIT.needsUser, `blocked on you: ${waiting.text}\n  Resolve it, then run the autopilot again with --unblock.`)
    if (cfg.pauseSeconds > 0) await new Promise((r) => setTimeout(r, cfg.pauseSeconds * 1000))
  }
}

main().catch((err) => {
  process.stderr.write(`waterfall-auto: ${err.message}\n`)
  process.exit(EXIT.error)
})
