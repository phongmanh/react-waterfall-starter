#!/usr/bin/env node
// SessionStart hook: tells Claude where the waterfall project stands, so a new,
// resumed or compacted session continues the right phase instead of guessing.
import { PHASE_NAMES, STATUS_PATH, loadStatus, openChangeRequests, projectDir, readStdinJson } from './lib/status.mjs'

try {
  const input = await readStdinJson()
  const status = loadStatus(projectDir(input))

  if (!status) {
    process.stdout.write(
      `Waterfall: no project started yet (${STATUS_PATH} is missing). When the user asks to build the app, ` +
        `use the react-waterfall skill and begin Phase 1 (Requirements) in this repository's root.\n`,
    )
    process.exit(0)
  }

  const lines = [`Waterfall status (${STATUS_PATH}):`]
  if (status.projectStatus) lines.push(`- Project: ${status.projectStatus}`)
  if (status.currentPhase) lines.push(`- Current phase: ${status.currentPhase}`)
  for (const [id, name] of Object.entries(PHASE_NAMES)) {
    const p = status.phases[id]
    if (p) lines.push(`- ${id} ${name}: ${p.status || 'unknown'}${p.approvedOn ? ` (approved ${p.approvedOn})` : ''}`)
  }
  if (status.gatePolicy && /waiv/i.test(status.gatePolicy)) lines.push(`- Gate policy: ${status.gatePolicy}`)
  const open = openChangeRequests(status)
  if (open.length) lines.push(`- Open change requests: ${open.map((cr) => `${cr.id} (${cr.status})`).join(', ')}`)
  const awaiting = Object.entries(status.phases).find(([, p]) => /awaiting approval/i.test(p.status))
  lines.push(
    awaiting
      ? `Phase ${awaiting[0]} is awaiting the user's approval: do not start the next phase until they explicitly approve.`
      : 'Continue with the react-waterfall skill. Re-read the approved documents before working on the current phase.',
  )
  process.stdout.write(lines.join('\n') + '\n')
  process.exit(0)
} catch (err) {
  process.stderr.write(`session-context hook error (ignored): ${err instanceof Error ? err.message : String(err)}\n`)
  process.exit(0)
}
