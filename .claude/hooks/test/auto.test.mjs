// Tests for the waterfall autopilot (.claude/auto/). Run with: node --test '.claude/hooks/test/*.test.mjs'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { after, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { DEFAULTS, EXIT, buildClaudeArgs, buildPrompt, decide, loadConfig, parseArgs, parseWaiting, renderEvent, validateConfig } from '../../auto/lib.mjs'
import { parseHandoff, parseStatus } from '../lib/status.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const RUNNER = path.join(ROOT, '.claude/auto/waterfall-auto.mjs')
const tempDirs = []
after(() => tempDirs.forEach((d) => rmSync(d, { recursive: true, force: true })))

const PHASES = ['P1 Requirements', 'P2 Design', 'P3 Implementation', 'P4 Testing', 'P5 Deployment', 'P6 Maintenance']

/** A STATUS.md where the first `approved` phases are done and the next has `nextStatus`. */
function statusDoc({ approved = 0, nextStatus = 'In progress', waiting = 'nothing', projectStatus = 'Active', cr = '' } = {}) {
  const rows = PHASES.map((p, i) => `| ${p} | doc | ${i < approved ? 'Approved (gate waived)' : i === approved ? nextStatus : 'Not started'} | | |`)
  return `# Demo — Waterfall status

| | |
|---|---|
| Current phase | ${PHASES[Math.min(approved, 5)]} |
| Project status | ${projectStatus} |
| Gate policy | Hard sign-off per phase |

## Phases

| Phase | Deliverable | Status | Approved on | Notes |
|---|---|---|---|---|
${rows.join('\n')}

## Change requests

| ID | Date | Change & reason | Affects (docs / files / tests) | Status |
|---|---|---|---|---|
${cr}

## Handoff

- **Last session:** 2026-11-12 — did a unit
- **Next action:** continue
- **Waiting on user:** ${waiting}
`
}

const cfg = (over = {}) => validateConfig({ ...DEFAULTS, ...over })
const verdict = (doc, over = {}, extra = {}) =>
  decide({ status: doc ? parseStatus(doc) : null, handoff: doc ? parseHandoff(doc) : '', cfg: cfg(over), briefExists: false, ...extra })

describe('autopilot config', () => {
  it('the committed config.json is valid and sets every option', () => {
    const file = JSON.parse(readFileSync(path.join(ROOT, '.claude/auto/config.json'), 'utf8'))
    validateConfig(file)
    assert.deepEqual(Object.keys(file).sort(), Object.keys(DEFAULTS).sort())
  })

  it('layers config.json, config.local.json and CLI overrides', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'waterfall-auto-'))
    tempDirs.push(dir)
    mkdirSync(path.join(dir, '.claude/auto'), { recursive: true })
    writeFileSync(path.join(dir, '.claude/auto/config.json'), JSON.stringify({ maxSessions: 5, commit: 'none' }))
    writeFileSync(path.join(dir, '.claude/auto/config.local.json'), JSON.stringify({ maxSessions: 7 }))
    const c = loadConfig(dir, { untilPhase: 'P2' })
    assert.equal(c.maxSessions, 7)
    assert.equal(c.commit, 'none')
    assert.equal(c.untilPhase, 'P2')
    assert.equal(c.onQuestion, DEFAULTS.onQuestion)
  })

  it('rejects unknown options and bad values', () => {
    assert.throws(() => validateConfig({ nope: 1 }), /Unknown autopilot option/)
    assert.throws(() => validateConfig({ stopAtGates: ['P9'] }), /stopAtGates/)
    assert.throws(() => validateConfig({ commit: 'push' }), /commit/)
  })

  it('parses CLI options, flags and the brief', () => {
    const a = parseArgs(['Build a todo app', '--stop-at-gates=P1,P2', '--max-sessions', '3', '--quiet', '--model=opus', '--dry-run', '--max-budget-usd=12.5'])
    assert.deepEqual(a.positional, ['Build a todo app'])
    assert.deepEqual(a.overrides, { stopAtGates: ['P1', 'P2'], maxSessions: 3, quiet: true, model: 'opus', maxBudgetUsd: 12.5 })
    assert.equal(a.flags.dryRun, true)
    assert.throws(() => parseArgs(['--bogus=1']), /Unknown option/)
  })
})

describe('autopilot decide', () => {
  it('needs a brief to start a new project', () => {
    assert.equal(verdict(null).code, EXIT.needsUser)
    assert.equal(verdict(null, {}, { briefExists: true }).action, 'run')
  })

  it('runs while work remains and stops when the project is closed', () => {
    assert.equal(verdict(statusDoc({ approved: 2 })).action, 'run')
    assert.equal(verdict(statusDoc({ approved: 6 })).code, EXIT.done)
    assert.equal(verdict(statusDoc({ approved: 5, projectStatus: 'Closed — v1.0.0' })).code, EXIT.done)
  })

  it('stops at untilPhase', () => {
    assert.equal(verdict(statusDoc({ approved: 2 }), { untilPhase: 'P2' }).code, EXIT.done)
    assert.equal(verdict(statusDoc({ approved: 1 }), { untilPhase: 'P2' }).action, 'run')
  })

  it('stops at a kept gate, runs through a waived one', () => {
    const doc = statusDoc({ approved: 1, nextStatus: 'Awaiting approval' })
    assert.equal(verdict(doc).action, 'run')
    const v = verdict(doc, { stopAtGates: ['P2'] })
    assert.equal(v.code, EXIT.needsUser)
    assert.match(v.reason, /P2 Design is awaiting your approval/)
  })

  it('stops on a Proposed change request only when changeRequests is "stop"', () => {
    const doc = statusDoc({ approved: 2, cr: '| CR-001 | 2026-11-12 | Add export | 01, 02 | Proposed |' })
    assert.equal(verdict(doc).action, 'run')
    assert.equal(verdict(doc, { changeRequests: 'stop' }).code, EXIT.needsUser)
  })

  it('stops on a BLOCKED handoff until --unblock', () => {
    const doc = statusDoc({ approved: 2, waiting: 'BLOCKED: need the API key for the staging backend' })
    assert.match(verdict(doc).reason, /API key/)
    assert.equal(verdict(doc, {}, { unblock: true }).action, 'run')
    assert.equal(parseWaiting('- **Waiting on user:** approve P1').blocked, false)
    assert.equal(parseWaiting('- **Waiting on user:** nothing').blocked, false)
  })
})

describe('autopilot prompt and command', () => {
  it('waives every gate by default and never grants a plain Approved', () => {
    const p = buildPrompt({ cfg: cfg(), status: null, session: 1, today: '2026-11-12' })
    assert.match(p, /docs\/waterfall\/inputs\/brief\.md/)
    assert.match(p, /waived sign-off for: P1 Requirements, .*P6 Maintenance/)
    assert.match(p, /Approved \(gate waived\)/)
    assert.match(p, /Never write a plain `Approved`/)
    assert.match(p, /phase-reviewer/)
    assert.match(p, /Commit per session/)
    assert.doesNotMatch(p, /keeps the hard gate/)
  })

  it('reflects the options', () => {
    const p = buildPrompt({
      cfg: cfg({ stopAtGates: ['P1', 'P2'], onQuestion: 'stop', changeRequests: 'stop', commit: 'none', review: false, extraPrompt: 'Use pnpm.' }),
      status: parseStatus(statusDoc({ approved: 1 })),
      session: 4,
      today: '2026-11-12',
      unblock: true,
    })
    assert.match(p, /keeps the hard gate for: P1 Requirements, P2 Design/)
    assert.match(p, /waived sign-off for: P3 Implementation/)
    assert.match(p, /do not guess/)
    assert.match(p, /as `Proposed`/)
    assert.match(p, /Do not commit/)
    assert.doesNotMatch(p, /phase-reviewer/)
    assert.match(p, /Use pnpm\./)
    assert.match(p, /blocker .* is resolved/)
    assert.match(p, /## Handoff/)
  })

  it('builds the claude command', () => {
    const args = buildClaudeArgs({ cfg: cfg({ model: 'opus', allowedTools: ['Bash(npx *)'] }), prompt: 'go', budgetLeft: 3.456 })
    assert.deepEqual(args.slice(0, 2), ['-p', 'go'])
    assert.ok(args.join(' ').includes('--permission-mode acceptEdits --model opus --max-budget-usd 3.46 --allowedTools Bash(npx *)'))
    assert.ok(!buildClaudeArgs({ cfg: cfg(), prompt: 'go' }).includes('--model'))
  })

  it('renders stream events', () => {
    const tool = JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'Drafting' }, { type: 'tool_use', name: 'Write', input: { file_path: 'docs/x.md' } }] } })
    assert.equal(renderEvent(tool).text, 'Drafting\n  → Write docs/x.md')
    assert.deepEqual(renderEvent(JSON.stringify({ type: 'result', is_error: false, total_cost_usd: 1.5, num_turns: 9, result: 'ok' })).result, { isError: false, costUsd: 1.5, turns: 9, summary: 'ok' })
    assert.equal(renderEvent('not json').text, '')
  })
})

describe('autopilot runner', () => {
  // A stand-in for the `claude` CLI: each call plays the next step of FAKE_SCRIPT.
  const FAKE = `#!/usr/bin/env node
const fs = require('node:fs'), path = require('node:path')
const counter = path.join(process.cwd(), 'calls.txt')
const n = fs.existsSync(counter) ? Number(fs.readFileSync(counter, 'utf8')) : 0
fs.writeFileSync(counter, String(n + 1))
fs.appendFileSync(path.join(process.cwd(), 'argv.log'), JSON.stringify({ args: process.argv.slice(2), auto: process.env.WATERFALL_AUTO }) + '\\n')
const steps = JSON.parse(process.env.FAKE_SCRIPT)
const step = steps[Math.min(n, steps.length - 1)]
if (step.status) {
  fs.mkdirSync(path.join(process.cwd(), 'docs/waterfall'), { recursive: true })
  fs.writeFileSync(path.join(process.cwd(), 'docs/waterfall/STATUS.md'), step.status)
}
console.log(JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'working ' + n }] } }))
console.log(JSON.stringify({ type: 'result', is_error: Boolean(step.fail), total_cost_usd: 0.25, num_turns: 3, result: 'done ' + n }))
process.exit(step.fail ? 1 : 0)
`

  function run(steps, args = [], seed) {
    const dir = mkdtempSync(path.join(tmpdir(), 'waterfall-auto-'))
    tempDirs.push(dir)
    const bin = path.join(dir, 'fake-claude.cjs')
    writeFileSync(bin, FAKE)
    chmodSync(bin, 0o755)
    if (seed) {
      mkdirSync(path.join(dir, 'docs/waterfall'), { recursive: true })
      writeFileSync(path.join(dir, 'docs/waterfall/STATUS.md'), seed)
    }
    const res = spawnSync(process.execPath, [RUNNER, `--claude-bin=${bin}`, ...args], {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, CLAUDE_PROJECT_DIR: dir, FAKE_SCRIPT: JSON.stringify(steps) },
    })
    const calls = existsSync(path.join(dir, 'calls.txt')) ? Number(readFileSync(path.join(dir, 'calls.txt'), 'utf8')) : 0
    return { ...res, dir, calls }
  }

  it('starts from a brief and runs fresh sessions until the project is closed', () => {
    const steps = [1, 2, 3, 4, 5, 6].map((approved) => ({ status: statusDoc({ approved }) }))
    const r = run(steps, ['Build a todo app'])
    assert.equal(r.status, EXIT.done, r.stdout + r.stderr)
    assert.equal(r.calls, 6)
    assert.match(readFileSync(path.join(r.dir, 'docs/waterfall/inputs/brief.md'), 'utf8'), /Build a todo app/)
    assert.match(r.stdout, /Project is closed/)
    assert.match(r.stdout, /6 sessions, \$1\.50/)
    assert.equal(readdirSync(path.join(r.dir, '.waterfall-auto/logs')).length, 6)
    const first = JSON.parse(readFileSync(path.join(r.dir, 'argv.log'), 'utf8').split('\n')[0])
    assert.equal(first.auto, '1')
    assert.equal(first.args[0], '-p')
    assert.match(first.args[1], /Waterfall autopilot, session 1/)
  })

  it('stops without running when there is nothing to build from', () => {
    const r = run([{}])
    assert.equal(r.status, EXIT.needsUser)
    assert.equal(r.calls, 0)
  })

  it('stops when a session reports a blocker', () => {
    const r = run([{ status: statusDoc({ approved: 2, waiting: 'BLOCKED: need a Vercel token' }) }], [], statusDoc({ approved: 1 }))
    assert.equal(r.status, EXIT.needsUser)
    assert.equal(r.calls, 1)
    assert.match(r.stdout, /need a Vercel token/)
  })

  it('stops at a kept gate once the session reaches it', () => {
    const r = run([{ status: statusDoc({ approved: 0, nextStatus: 'Awaiting approval' }) }], ['--stop-at-gates=P1'], statusDoc())
    assert.equal(r.status, EXIT.needsUser)
    assert.equal(r.calls, 1)
    assert.match(r.stdout, /P1 Requirements is awaiting your approval/)
  })

  it('stops when sessions change nothing', () => {
    const r = run([{}], ['--max-stalls=2'], statusDoc({ approved: 1 }))
    assert.equal(r.status, EXIT.stalled)
    assert.equal(r.calls, 2)
  })

  it('stops after repeated failures, at maxSessions, at the budget, and after --once', () => {
    assert.equal(run([{ fail: true }], ['--max-failures=2', '--max-stalls=9'], statusDoc()).status, EXIT.error)
    const steps = [1, 2, 3].map((approved) => ({ status: statusDoc({ approved }) }))
    const capped = run(steps, ['--max-sessions=2'], statusDoc())
    assert.equal(capped.status, EXIT.limit)
    assert.equal(capped.calls, 2)
    const budget = run(steps, ['--max-budget-usd=0.5'], statusDoc())
    assert.equal(budget.status, EXIT.limit)
    assert.equal(budget.calls, 2)
    assert.equal(run(steps, ['--once'], statusDoc()).calls, 1)
  })

  it('--dry-run prints the prompt and runs nothing', () => {
    const r = run([{}], ['--dry-run'], statusDoc({ approved: 1 }))
    assert.equal(r.status, 0)
    assert.equal(r.calls, 0)
    assert.match(r.stdout, /--permission-mode acceptEdits/)
    assert.match(r.stdout, /Waterfall autopilot, session 1/)
    const fresh = run([{}], ['--dry-run', 'Build a todo app'])
    assert.equal(fresh.status, 0)
    assert.equal(existsSync(path.join(fresh.dir, 'docs')), false)
  })
})
