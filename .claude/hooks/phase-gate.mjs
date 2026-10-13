#!/usr/bin/env node
// PreToolUse hook: enforces waterfall phase gates mechanically.
//  - Blocks writes to application code until Phase 2 (Design) is approved in STATUS.md.
//  - Blocks deployment config/CI until Phase 4 (Testing) is approved.
//  - Blocks scaffolding / dependency installs before Phase 3.
//  - Always blocks commands that would wipe docs/waterfall (e.g. create-vite --overwrite).
// The user (never Claude) can disable it for a session by setting WATERFALL_GATE=off,
// e.g. in .claude/settings.local.json → "env": { "WATERFALL_GATE": "off" }.
import {
  PHASE_NAMES,
  STATUS_PATH,
  loadStatus,
  phaseApproved,
  projectDir,
  readStdinJson,
  relativeToProject,
  requiredPhaseFor,
} from './lib/status.mjs'

const OVERRIDE_NOTE =
  'Only the user may override this gate (WATERFALL_GATE=off in .claude/settings.local.json). Do not edit STATUS.md, the hooks or settings to get past it.'

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
    }),
  )
  process.exit(0)
}

function describePhase(status, phase) {
  if (!status) return `no waterfall project has been started (${STATUS_PATH} does not exist)`
  const s = status.phases[phase]?.status || 'missing'
  return `Phase ${phase.slice(1)} (${PHASE_NAMES[phase]}) is "${s}" in ${STATUS_PATH}`
}

function checkPath(dir, status, filePath) {
  const rel = relativeToProject(dir, filePath)
  if (!rel) return // outside the project: not ours to gate
  const required = requiredPhaseFor(rel)
  if (!required || phaseApproved(status, required)) return
  const next = `P${Number(required.slice(1)) + 1}`
  deny(
    `Phase gate: ${rel} is Phase ${next.slice(1)} (${PHASE_NAMES[next]}) work, but ${describePhase(status, required)}. ` +
      `Finish the current phase with the react-waterfall skill and get the user's explicit approval first. ${OVERRIDE_NOTE}`,
  )
}

const DESTRUCTIVE = [
  { re: /create[- ]vite\b[^\n;&|]*--overwrite|--overwrite\b[^\n;&|]*create[- ]vite/, why: 'create-vite --overwrite empties the target directory, including docs/waterfall/' },
  { re: /\brm\s+(-\w+\s+)*[^\n;&|]*\bdocs(\/waterfall)?\/?(\s|$|[;&|])/, why: 'it deletes the baselined waterfall documents' },
]

const SCAFFOLD_OR_INSTALL =
  /\b(npm\s+(create|init)\s+vite|create-vite|npm\s+(i|install|add|ci)\b|npx\s+create-|pnpm\s+(add|install|create|i)\b|yarn\s+(add|install|create)\b|bun\s+(add|install|create|i)\b)/

const WRITES = /(>{1,2}|\b(tee|cp|mv|touch|mkdir|ln|install)\b|\bsed\s+-i|\bperl\s+-[a-z]*i)/
const APP_PATH_TOKEN = /(^|[\s"'=(])(\.\/)?(src|e2e|public)\/|(^|[\s"'])(\.\/)?(index\.html|package\.json|vite\.config\.\w+|tsconfig[\w.-]*\.json)\b/

function checkBash(status, command) {
  for (const { re, why } of DESTRUCTIVE) {
    if (re.test(command)) deny(`Blocked: ${why}. Scaffold into a temp folder and copy with cp -Rn instead (see the react-waterfall tech-stack reference). ${OVERRIDE_NOTE}`)
  }
  if (phaseApproved(status, 'P2')) return
  if (SCAFFOLD_OR_INSTALL.test(command)) {
    deny(`Phase gate: scaffolding and installing dependencies are Phase 3 work, but ${describePhase(status, 'P2')}. ${OVERRIDE_NOTE}`)
  }
  if (WRITES.test(command) && APP_PATH_TOKEN.test(command)) {
    deny(`Phase gate: this command writes application files, which is Phase 3 work, but ${describePhase(status, 'P2')}. ${OVERRIDE_NOTE}`)
  }
}

try {
  if ((process.env.WATERFALL_GATE ?? '').toLowerCase() === 'off') process.exit(0)
  const input = await readStdinJson()
  const dir = projectDir(input)
  const status = loadStatus(dir)
  const toolInput = input.tool_input ?? {}

  switch (input.tool_name) {
    case 'Write':
    case 'Edit':
    case 'MultiEdit':
      if (toolInput.file_path) checkPath(dir, status, toolInput.file_path)
      break
    case 'NotebookEdit':
      if (toolInput.notebook_path) checkPath(dir, status, toolInput.notebook_path)
      break
    case 'Bash':
      if (toolInput.command) checkBash(status, toolInput.command)
      break
  }
  process.exit(0)
} catch (err) {
  // Never wedge the session on a hook bug; report it and let the normal permission flow decide.
  process.stderr.write(`phase-gate hook error (ignored): ${err instanceof Error ? err.message : String(err)}\n`)
  process.exit(0)
}
