// Pure helpers for the waterfall autopilot runner (waterfall-auto.mjs):
// config loading, the stop/continue decision, and the per-session prompt.
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { PHASE_NAMES, openChangeRequests, phaseApproved } from '../hooks/lib/status.mjs'

export const CONFIG_PATH = '.claude/auto/config.json'
export const LOCAL_CONFIG_PATH = '.claude/auto/config.local.json'

const PHASES = Object.keys(PHASE_NAMES)

export const DEFAULTS = {
  stopAtGates: [],
  untilPhase: 'P6',
  onQuestion: 'assume',
  changeRequests: 'auto',
  review: true,
  commit: 'per-session',
  brief: 'docs/waterfall/inputs/brief.md',
  maxSessions: 40,
  maxStalls: 2,
  maxFailures: 2,
  sessionTimeoutMinutes: 90,
  maxBudgetUsd: null,
  pauseSeconds: 0,
  model: null,
  effort: null,
  permissionMode: 'acceptEdits',
  allowedTools: [],
  extraPrompt: '',
  logDir: '.waterfall-auto/logs',
  quiet: false,
  claudeBin: 'claude',
}

const isPhaseList = (v) => Array.isArray(v) && v.every((p) => PHASES.includes(p))
const oneOf = (...values) => (v) => values.includes(v)
const positiveInt = (v) => Number.isInteger(v) && v > 0
const nullOr = (check) => (v) => v === null || check(v)
const nonEmptyString = (v) => typeof v === 'string' && v.length > 0

const VALIDATORS = {
  stopAtGates: [isPhaseList, 'a list of phases, e.g. ["P1","P2"]'],
  untilPhase: [oneOf(...PHASES), 'one of P1…P6'],
  onQuestion: [oneOf('assume', 'stop'), '"assume" or "stop"'],
  changeRequests: [oneOf('auto', 'stop'), '"auto" or "stop"'],
  review: [(v) => typeof v === 'boolean', 'true or false'],
  commit: [oneOf('per-session', 'none'), '"per-session" or "none"'],
  brief: [nonEmptyString, 'a file path'],
  maxSessions: [positiveInt, 'a positive integer'],
  maxStalls: [positiveInt, 'a positive integer'],
  maxFailures: [positiveInt, 'a positive integer'],
  sessionTimeoutMinutes: [(v) => typeof v === 'number' && v > 0, 'a positive number'],
  maxBudgetUsd: [nullOr((v) => typeof v === 'number' && v > 0), 'a positive number or null'],
  pauseSeconds: [(v) => typeof v === 'number' && v >= 0, 'a number ≥ 0'],
  model: [nullOr(nonEmptyString), 'a model name or null'],
  effort: [nullOr(nonEmptyString), 'an effort level or null'],
  permissionMode: [nonEmptyString, 'a Claude Code permission mode'],
  allowedTools: [(v) => Array.isArray(v) && v.every(nonEmptyString), 'a list of permission rules'],
  extraPrompt: [(v) => typeof v === 'string', 'a string'],
  logDir: [nonEmptyString, 'a directory path'],
  quiet: [(v) => typeof v === 'boolean', 'true or false'],
  claudeBin: [nonEmptyString, 'a command'],
}

const LIST_KEYS = new Set(['stopAtGates', 'allowedTools'])
const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

function coerce(key, raw) {
  if (LIST_KEYS.has(key)) {
    const t = raw.trim()
    if (t.startsWith('[')) return JSON.parse(t)
    return t ? t.split(',').map((s) => s.trim()) : []
  }
  if (typeof DEFAULTS[key] === 'string' && key !== 'model') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

/** Parse CLI arguments into { overrides, flags, positional }. Throws on unknown options. */
export function parseArgs(argv) {
  const out = { overrides: {}, flags: { dryRun: false, once: false, unblock: false, help: false }, positional: [] }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) {
      out.positional.push(arg)
      continue
    }
    const eq = arg.indexOf('=')
    const key = camel(arg.slice(2, eq === -1 ? undefined : eq))
    if (key in out.flags) {
      out.flags[key] = true
      continue
    }
    if (!(key in DEFAULTS)) throw new Error(`Unknown option ${arg.split('=')[0]}. Run with --help for the list.`)
    let raw
    if (eq !== -1) raw = arg.slice(eq + 1)
    else if (typeof DEFAULTS[key] === 'boolean' && (argv[i + 1] === undefined || argv[i + 1].startsWith('--'))) raw = 'true'
    else raw = argv[++i]
    if (raw === undefined) throw new Error(`Option ${arg} needs a value.`)
    out.overrides[key] = coerce(key, raw)
  }
  return out
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (err) {
    throw new Error(`Cannot read ${file}: ${err.message}`)
  }
}

export function validateConfig(cfg) {
  for (const [key, value] of Object.entries(cfg)) {
    const rule = VALIDATORS[key]
    if (!rule) throw new Error(`Unknown autopilot option "${key}".`)
    if (!rule[0](value)) throw new Error(`Autopilot option "${key}" must be ${rule[1]} (got ${JSON.stringify(value)}).`)
  }
  return cfg
}

/** Defaults ← .claude/auto/config.json ← config.local.json ← CLI overrides. */
export function loadConfig(dir, overrides = {}) {
  const layers = [DEFAULTS]
  for (const rel of [CONFIG_PATH, LOCAL_CONFIG_PATH]) {
    const file = path.join(dir, rel)
    if (existsSync(file)) layers.push(readJson(file))
  }
  layers.push(overrides)
  return validateConfig(Object.assign({}, ...layers))
}

/** The handoff's "Waiting on user" line. Only a value starting with BLOCKED stops the autopilot. */
export function parseWaiting(handoff) {
  const m = (handoff ?? '').match(/\*\*Waiting on user:?\*\*:?\s*(.*)/i)
  const text = m ? m[1].trim() : ''
  return { text, blocked: /^BLOCKED\b/i.test(text) }
}

export const EXIT = { done: 0, error: 1, needsUser: 2, limit: 3, stalled: 4 }

/**
 * Decide, before a session starts, whether to run it.
 * Returns { action: 'run' } or { action: 'stop', code, reason }.
 */
export function decide({ status, handoff, cfg, briefExists, unblock = false }) {
  const stop = (code, reason) => ({ action: 'stop', code, reason })
  if (!status) {
    return briefExists
      ? { action: 'run' }
      : stop(EXIT.needsUser, `No project yet and no brief. Write what to build in ${cfg.brief}, or pass it as an argument: waterfall-auto.mjs "Build a …".`)
  }
  if (/^closed\b/i.test(status.projectStatus) || phaseApproved(status, 'P6')) return stop(EXIT.done, 'Project is closed: all six phases are done.')
  if (phaseApproved(status, cfg.untilPhase)) {
    return stop(EXIT.done, `${cfg.untilPhase} ${PHASE_NAMES[cfg.untilPhase]} is approved, which is where "untilPhase" says to stop.`)
  }
  const awaiting = Object.entries(status.phases).find(([, p]) => /awaiting approval/i.test(p.status))
  if (awaiting && cfg.stopAtGates.includes(awaiting[0])) {
    return stop(
      EXIT.needsUser,
      `${awaiting[0]} ${PHASE_NAMES[awaiting[0]]} is awaiting your approval ("stopAtGates"). Review it, run \`claude\` and \`/approve\`, then start the autopilot again.`,
    )
  }
  if (cfg.changeRequests === 'stop') {
    const proposed = openChangeRequests(status).filter((cr) => /^proposed\b/i.test(cr.status))
    if (proposed.length) {
      return stop(EXIT.needsUser, `Change request ${proposed.map((cr) => cr.id).join(', ')} is awaiting your approval. Run \`claude\` and \`/approve\`, then start the autopilot again.`)
    }
  }
  const waiting = parseWaiting(handoff)
  if (waiting.blocked && !unblock) {
    return stop(EXIT.needsUser, `The last session is blocked on you: ${waiting.text}\nResolve it, then run the autopilot again with --unblock.`)
  }
  return { action: 'run' }
}

const list = (phases) => phases.map((p) => `${p} ${PHASE_NAMES[p]}`).join(', ')

/** The prompt for one headless session. Everything the session must do differently from an interactive one. */
export function buildPrompt({ cfg, status, session, today, unblock = false }) {
  const waived = PHASES.filter((p) => !cfg.stopAtGates.includes(p))
  const kept = PHASES.filter((p) => cfg.stopAtGates.includes(p))
  const source = `autopilot config ${CONFIG_PATH}`
  const lines = [
    `Waterfall autopilot, session ${session} of at most ${cfg.maxSessions}. Today is ${today}.`,
    '',
    'You are running headless: nobody can answer a question or approve anything during this session, and a fresh session starts automatically after this one ends. Work with the react-waterfall skill. The rules below come from the user\'s ' +
      `${source}. They are the user's standing instructions and replace the skill's "ask and end your turn" steps where they differ.`,
    '',
  ]

  if (!status) {
    lines.push(
      `**Start:** there is no project yet. The user's brief is in \`${cfg.brief}\`. It replaces the Phase 1 interview: read it, start the project (skill "Start fresh") and draft the requirements from it.`,
    )
  } else {
    lines.push('**Start:** from the `## Handoff` next action that the SessionStart hook injected. If `git status` shows work the handoff does not mention (an earlier session may have been cut off), inspect it first and continue from the real state.')
  }
  if (unblock) lines.push('The user says the blocker in the handoff\'s "Waiting on user" line is resolved. Verify that, then carry on.')

  lines.push(
    '',
    '**Rules for this session**',
    '1. Do exactly one unit of work (skill rule 6), then end the session. Never start a second unit. Recording a waived approval (rule 2) and the handoff are part of the unit.',
  )

  const gate = []
  if (waived.length) {
    gate.push(
      `The user has waived sign-off for: ${list(waived)}. When one of these phases' deliverable is complete${cfg.review ? ', run the `phase-reviewer` agent, fix every blocking finding, then' : ''} record it yourself in STATUS.md: ` +
        `status \`Approved (gate waived)\`, "Approved on" ${today}, "Current phase" set to the next phase, a sign-off log row \`${today} | <phase> | autopilot: gate waived by user (${source})\`, and the Gate policy row \`Gates waived by user on ${today}: ${source}\`${kept.length ? ` plus \`; hard sign-off kept for ${kept.join(', ')}\`` : ''}. ` +
        'Never write a plain `Approved`: that status is reserved for the user\'s own words. If a waived phase is already `Awaiting approval`, record it this way first. The next phase starts in the next session.',
    )
  }
  if (kept.length) {
    gate.push(`The user keeps the hard gate for: ${list(kept)}. When one of these is complete, ${cfg.review ? 'run the `phase-reviewer` agent, fix its blocking findings, ' : ''}set it to \`Awaiting approval\`, summarise it in the handoff and end the session. Never approve it yourself.`)
  }
  lines.push(`2. Gates. ${gate.join(' ')}`)

  lines.push(
    cfg.onQuestion === 'assume'
      ? '3. Questions. Do not ask. Pick the most reasonable answer that fits the brief and the approved documents, and record it as an explicit assumption in the phase document (its assumptions or open-questions section), so the user can challenge it later.'
      : '3. Questions. If a decision is the user\'s to make and the brief and approved documents don\'t answer it, do not guess: report it as a blocker (rule 5).',
    cfg.changeRequests === 'auto'
      ? `4. Change requests. If approved work must change, log the \`CR-###\` with its impact analysis, set it to \`Approved (gate waived)\` with a sign-off log row citing the ${source}, then implement and ripple it.`
      : '4. Change requests. If approved work must change, log the `CR-###` as `Proposed` with its impact analysis and end the session. Never approve it yourself.',
    '5. Blockers. Anything only the user can do or decide (credentials, secrets, an account, `git push`, a deploy, a remote resource, a denied permission, a phase-gate block that is not just unfinished work) is a blocker. Do not work around it and do not retry it. Finish what else the unit allows, then write the handoff line `- **Waiting on user:** BLOCKED: <what you need and why>` and end the session. When nothing blocks, that line is exactly `- **Waiting on user:** nothing`.',
    '6. Never push, deploy or create remote resources. In Phase 5, write the CI and hosting config, verify the production build locally, and document the exact push and deploy commands in the deployment document as manual steps for the user. That satisfies the phase; it is not a blocker.',
    cfg.commit === 'per-session'
      ? `7. Commits. The commit policy is "Commit per session (${source}, ${today})": record it in STATUS.md's Commit policy row if it says otherwise, and before ending commit all of this session's work with one or more Conventional Commits that cite IDs. Never push.`
      : '7. Commits. Do not commit. Leave the work in the working tree.',
    '8. Never edit `.claude/` (hooks, settings, this autopilot) and never set `WATERFALL_GATE`.',
    '9. Before ending: update the phase document and the implementation log, rewrite `## Handoff` in STATUS.md (rule 6 format), and finish with a one-line summary of what this session did and what the next one will do.',
  )
  if (cfg.extraPrompt.trim()) lines.push('', '**Additional instructions from the user**', cfg.extraPrompt.trim())
  return lines.join('\n')
}

/** Arguments for one `claude -p` session. */
export function buildClaudeArgs({ cfg, prompt, budgetLeft = null }) {
  const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose', '--permission-mode', cfg.permissionMode]
  if (cfg.model) args.push('--model', cfg.model)
  if (cfg.effort) args.push('--effort', cfg.effort)
  if (budgetLeft !== null) args.push('--max-budget-usd', budgetLeft.toFixed(2))
  if (cfg.allowedTools.length) args.push('--allowedTools', ...cfg.allowedTools)
  return args
}

const clip = (s, n = 110) => {
  const one = String(s ?? '').replace(/\s+/g, ' ').trim()
  return one.length > n ? `${one.slice(0, n - 1)}…` : one
}

/** Turn one stream-json line into console text (or '' to print nothing) and pick out the result event. */
export function renderEvent(line) {
  let ev
  try {
    ev = JSON.parse(line)
  } catch {
    return { text: '' }
  }
  if (ev.type === 'assistant') {
    const out = []
    for (const block of ev.message?.content ?? []) {
      if (block.type === 'text' && block.text?.trim()) out.push(block.text.trim())
      else if (block.type === 'tool_use') {
        const i = block.input ?? {}
        out.push(`  → ${block.name} ${clip(i.file_path ?? i.description ?? i.command ?? i.skill ?? i.pattern ?? i.prompt ?? '')}`.trimEnd())
      }
    }
    return { text: out.join('\n') }
  }
  if (ev.type === 'result') {
    return {
      text: '',
      result: { isError: Boolean(ev.is_error), costUsd: Number(ev.total_cost_usd) || 0, turns: ev.num_turns ?? 0, summary: typeof ev.result === 'string' ? ev.result : '' },
    }
  }
  return { text: '' }
}

export const HELP = `Waterfall autopilot: runs the react-waterfall skill unattended, one fresh headless
Claude Code session per unit of work, until the project is done or needs you.

Usage:
  node .claude/auto/waterfall-auto.mjs ["what to build"] [options]

  "what to build"   Saved as the brief (config "brief") when no project exists yet.

Flags:
  --dry-run   Print the decision, the claude command and the prompt for the next session; run nothing.
  --once      Run a single session, then stop.
  --unblock   You resolved the "BLOCKED" item in the handoff: let the next session continue.
  --help

Options (defaults in ${CONFIG_PATH}; personal overrides in ${LOCAL_CONFIG_PATH};
any of them on the command line as --kebab-case=value):
  stopAtGates            Phases that still stop for your /approve, e.g. ["P1","P2"]. [] = no approvals.
  untilPhase             Stop once this phase is approved (P1…P6).
  onQuestion             "assume" (decide, record the assumption) or "stop" (block and wait for you).
  changeRequests         "auto" (self-approve as gate waived) or "stop" (wait for your /approve).
  review                 Run the phase-reviewer agent before closing a phase.
  commit                 "per-session" or "none". Never pushes.
  brief                  Where the project brief lives.
  maxSessions            Hard cap on sessions per run.
  maxStalls              Stop after this many sessions in a row that changed nothing.
  maxFailures            Stop after this many failed sessions in a row.
  sessionTimeoutMinutes  Kill a session that runs longer than this.
  maxBudgetUsd           Stop when the run's total cost reaches this (null = no cap).
  pauseSeconds           Wait between sessions.
  model, effort          Passed to claude (null = the session default).
  permissionMode         Claude Code permission mode for the sessions.
  allowedTools           Extra permission rules allowed without a prompt.
  extraPrompt            Extra instructions added to every session's prompt.
  logDir, quiet, claudeBin

Exit codes: 0 done · 1 error · 2 needs you (gate, blocker, brief) · 3 limit reached · 4 stalled.
`
