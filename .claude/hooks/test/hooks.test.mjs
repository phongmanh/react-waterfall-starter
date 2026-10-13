// Run with: node --test .claude/hooks/test/
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { after, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { openChangeRequests, parseStatus, requiredPhaseFor } from '../lib/status.mjs'

const HOOKS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tempDirs = []
after(() => tempDirs.forEach((d) => rmSync(d, { recursive: true, force: true })))

const statusDoc = (p1, p2, p3 = 'Not started', p4 = 'Not started', crs = '') => `# Demo — Waterfall status

| | |
|---|---|
| Current phase | P2 Design |
| Project status | Active |
| Gate policy | Hard sign-off per phase |

## Phases

| Phase | Deliverable | Status | Approved on | Notes |
|---|---|---|---|---|
| P1 Requirements | [01-requirements.md](01-requirements.md) | ${p1} | 2026-10-13 | |
| P2 Design | [02-design.md](02-design.md) | ${p2} | | |
| P3 Implementation | code | ${p3} | | |
| P4 Testing | [04-test-report.md](04-test-report.md) | ${p4} | | |
| P5 Deployment | [05-deployment.md](05-deployment.md) | Not started | | |
| P6 Maintenance | [06-maintenance.md](06-maintenance.md) | Not started | | |

## Sign-off log

| Date | Phase / CR | Approved by (user's words) |
|---|---|---|
| 2026-10-13 | P1 Requirements | "approve" |

## Change requests

| ID | Date | Change & reason | Affects (docs / files / tests) | Status |
|---|---|---|---|---|
${crs}
`

function project(status) {
  const dir = mkdtempSync(path.join(tmpdir(), 'waterfall-hooks-'))
  tempDirs.push(dir)
  if (status) {
    mkdirSync(path.join(dir, 'docs/waterfall'), { recursive: true })
    writeFileSync(path.join(dir, 'docs/waterfall/STATUS.md'), status)
  }
  return dir
}

function runHook(script, dir, input, env = {}) {
  const res = spawnSync(process.execPath, [path.join(HOOKS, script)], {
    input: JSON.stringify({ cwd: dir, ...input }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir, WATERFALL_GATE: '', ...env },
    encoding: 'utf8',
  })
  const decision = res.stdout.trim().startsWith('{') ? JSON.parse(res.stdout).hookSpecificOutput : null
  return { code: res.status, stdout: res.stdout, stderr: res.stderr, decision }
}

const write = (dir, rel) => ({ tool_name: 'Write', tool_input: { file_path: path.join(dir, rel), content: 'x' } })
const bash = (command) => ({ tool_name: 'Bash', tool_input: { command } })
const denied = (r) => r.decision?.permissionDecision === 'deny'

describe('parseStatus', () => {
  it('reads phase statuses, current phase and open change requests', () => {
    const s = parseStatus(
      statusDoc('Approved', 'Awaiting approval', undefined, undefined,
        '| CR-001 | 2026-10-14 | Add tags | FR-009 | Proposed |\n| CR-002 | 2026-10-14 | Typo | — | Implemented |'),
    )
    assert.equal(s.currentPhase, 'P2 Design')
    assert.equal(s.phases.P1.status, 'Approved')
    assert.equal(s.phases.P2.status, 'Awaiting approval')
    assert.deepEqual(openChangeRequests(s).map((cr) => cr.id), ['CR-001'])
  })

  it('ignores the sign-off log rows', () => {
    assert.equal(Object.keys(parseStatus(statusDoc('Approved', 'In progress')).phases).length, 6)
  })
})

describe('requiredPhaseFor', () => {
  it('gates app code on design approval and deployment files on testing approval', () => {
    assert.equal(requiredPhaseFor('src/App.tsx'), 'P2')
    assert.equal(requiredPhaseFor('package.json'), 'P2')
    assert.equal(requiredPhaseFor('tsconfig.app.json'), 'P2')
    assert.equal(requiredPhaseFor('vite.config.ts'), 'P2')
    assert.equal(requiredPhaseFor('.github/workflows/ci.yml'), 'P4')
    assert.equal(requiredPhaseFor('public/_headers'), 'P4')
    assert.equal(requiredPhaseFor('vercel.json'), 'P4')
  })

  it('never gates the docs, Claude config or the hooks workflow', () => {
    for (const p of ['docs/waterfall/01-requirements.md', 'docs/waterfall/STATUS.md', '.claude/rules/x.md', 'README.md', 'CLAUDE.md', '.github/workflows/claude-hooks.yml']) {
      assert.equal(requiredPhaseFor(p), null, p)
    }
  })
})

describe('phase-gate hook', () => {
  it('blocks app code when no waterfall project exists', () => {
    const dir = project(null)
    const r = runHook('phase-gate.mjs', dir, write(dir, 'src/main.tsx'))
    assert.ok(denied(r))
    assert.match(r.decision.permissionDecisionReason, /no waterfall project has been started/)
  })

  it('allows phase documents before design approval', () => {
    const dir = project(statusDoc('Approved', 'In progress'))
    assert.ok(!denied(runHook('phase-gate.mjs', dir, write(dir, 'docs/waterfall/02-design.md'))))
  })

  it('blocks app code while design is awaiting approval', () => {
    const dir = project(statusDoc('Approved', 'Awaiting approval'))
    const r = runHook('phase-gate.mjs', dir, write(dir, 'src/features/todos/TodoList.tsx'))
    assert.ok(denied(r))
    assert.match(r.decision.permissionDecisionReason, /Phase 2 \(Design\) is "Awaiting approval"/)
  })

  it('allows app code once design is approved, including a waived gate', () => {
    for (const p2 of ['Approved', 'Approved (gate waived)']) {
      const dir = project(statusDoc('Approved', p2, 'In progress'))
      assert.ok(!denied(runHook('phase-gate.mjs', dir, write(dir, 'src/main.tsx'))), p2)
    }
  })

  it('blocks CI/deploy config until testing is approved', () => {
    const dir = project(statusDoc('Approved', 'Approved', 'Approved', 'In progress'))
    assert.ok(denied(runHook('phase-gate.mjs', dir, write(dir, '.github/workflows/ci.yml'))))
    const done = project(statusDoc('Approved', 'Approved', 'Approved', 'Approved'))
    assert.ok(!denied(runHook('phase-gate.mjs', done, write(done, '.github/workflows/ci.yml'))))
  })

  it('ignores files outside the project', () => {
    const dir = project(null)
    assert.ok(!denied(runHook('phase-gate.mjs', dir, write(dir, '../elsewhere/src/x.ts'))))
  })

  it('blocks scaffolding, installs and shell writes into src before design approval', () => {
    const dir = project(statusDoc('Approved', 'In progress'))
    for (const cmd of [
      'npm create vite@latest .scaffold -- --template react-ts',
      'npm install zod',
      'npm i',
      'pnpm add react-router',
      'mkdir -p src/features',
      "cat > src/main.tsx <<'EOF'\nx\nEOF",
    ]) {
      assert.ok(denied(runHook('phase-gate.mjs', dir, bash(cmd))), cmd)
    }
  })

  it('allows read-only and docs commands before design approval', () => {
    const dir = project(statusDoc('Approved', 'In progress'))
    for (const cmd of ['ls -la', 'cat docs/waterfall/STATUS.md', 'git status', 'mkdir -p docs/waterfall', 'node --test .claude/hooks/test/']) {
      assert.ok(!denied(runHook('phase-gate.mjs', dir, bash(cmd))), cmd)
    }
  })

  it('always blocks commands that would wipe the waterfall docs', () => {
    const dir = project(statusDoc('Approved', 'Approved', 'In progress'))
    for (const cmd of ['npm create vite@latest . -- --template react-ts --overwrite', 'rm -rf docs', 'rm -rf docs/waterfall/']) {
      assert.ok(denied(runHook('phase-gate.mjs', dir, bash(cmd))), cmd)
    }
    assert.ok(!denied(runHook('phase-gate.mjs', dir, bash('rm -rf .scaffold'))))
  })

  it('can be switched off by the user with WATERFALL_GATE=off', () => {
    const dir = project(null)
    assert.ok(!denied(runHook('phase-gate.mjs', dir, write(dir, 'src/main.tsx'), { WATERFALL_GATE: 'off' })))
  })

  it('fails open on malformed input instead of wedging the session', () => {
    const res = spawnSync(process.execPath, [path.join(HOOKS, 'phase-gate.mjs')], { input: 'not json', encoding: 'utf8' })
    assert.equal(res.status, 0)
    assert.match(res.stderr, /hook error \(ignored\)/)
  })
})

describe('session-context hook', () => {
  it('says no project has started when STATUS.md is missing', () => {
    const r = runHook('session-context.mjs', project(null), { hook_event_name: 'SessionStart', source: 'startup' })
    assert.equal(r.code, 0)
    assert.match(r.stdout, /no project started yet/)
  })

  it('summarises phases and flags a pending approval', () => {
    const dir = project(statusDoc('Approved', 'Awaiting approval', undefined, undefined, '| CR-001 | 2026-10-14 | Add tags | FR-009 | Proposed |'))
    const r = runHook('session-context.mjs', dir, { hook_event_name: 'SessionStart', source: 'resume' })
    assert.match(r.stdout, /P1 Requirements: Approved \(approved 2026-10-13\)/)
    assert.match(r.stdout, /P2 Design: Awaiting approval/)
    assert.match(r.stdout, /Open change requests: CR-001 \(Proposed\)/)
    assert.match(r.stdout, /awaiting the user's approval/)
  })
})

describe('format-lint hook', () => {
  it('is a no-op before the app is scaffolded', () => {
    const dir = project(statusDoc('Approved', 'Approved', 'In progress'))
    mkdirSync(path.join(dir, 'src'))
    writeFileSync(path.join(dir, 'src/a.ts'), 'export const a=1')
    const r = runHook('format-lint.mjs', dir, { tool_name: 'Write', tool_input: { file_path: path.join(dir, 'src/a.ts') } })
    assert.equal(r.code, 0)
    assert.equal(r.stderr, '')
  })
})
