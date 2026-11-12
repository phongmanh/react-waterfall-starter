# React Waterfall Starter

This repo is an empty starting point for building a React + TypeScript web app with the **Waterfall** SDLC. The app doesn't exist yet. It gets specified, designed, built, tested and shipped here, one approved phase at a time.

## How work happens here

- **Use the `react-waterfall` skill** (`.claude/skills/react-waterfall/`) for all app work, from the first requirement to the final handover.
- **This repository root is the project root.** Write docs to `docs/waterfall/` and scaffold the app into the root itself, not into a subfolder. Follow the skill's tech-stack setup, which scaffolds next to the existing files without overwriting them.
- **`docs/waterfall/STATUS.md` says where things stand.** The SessionStart hook summarises it at the start of every session. `/waterfall-status` shows the detail.
- **Short sessions.** Work one unit per session, then `/clear`. End every session by rewriting STATUS.md's `## Handoff` section, which the SessionStart hook injects into the next session (skill rule 6). External inputs are cached in `docs/waterfall/inputs/`, so don't re-fetch them.
- **Process rules** are in `.claude/rules/waterfall-process.md`. Coding, testing and doc rules load automatically when matching files are touched (`.claude/rules/`).

## Autopilot (no approvals, fresh session per unit)

`node .claude/auto/waterfall-auto.mjs "what to build"` runs the skill unattended. Each unit of work gets a fresh headless session; a session ends at its handoff and the runner starts the next one, until the project is closed, something needs the user (`BLOCKED:` in the handoff), or a limit is hit. Options live in `.claude/auto/config.json` (personal overrides in `config.local.json`, or `--option=value`); `--help` lists them. Autopilot sessions record waived gates as `Approved (gate waived)`. The hooks still apply, and it never pushes or deploys.

## Slash commands

| Command | Use |
|---|---|
| `/waterfall-status` | Current phase, sign-offs, open change requests, next action |
| `/approve [note]` | Sign off the phase or CR that's awaiting approval |
| `/change-request <what and why>` | Open a CR against baselined docs, with impact analysis |

## Enforced by hooks (`.claude/settings.json` → `.claude/hooks/`)

| Hook | Does |
|---|---|
| `session-context.mjs` (SessionStart) | Injects the phase status and the `## Handoff` section from STATUS.md |
| `phase-gate.mjs` (PreToolUse) | Blocks app code, scaffolding and installs until **P2 Design** is approved. Blocks CI and deploy config until **P4 Testing** is approved. Always blocks `create-vite --overwrite` and `rm -rf docs`. |
| `format-lint.mjs` (PostToolUse) | After an edit to an app file: runs Prettier, then oxlint. Lint errors go back to Claude. Inactive until the app is scaffolded. |

A blocked tool call means: finish the phase, or ask the user. Only the user can disable the gate, with `WATERFALL_GATE=off` in `.claude/settings.local.json` (`"env": { "WATERFALL_GATE": "off" }`). Hook tests: `node --test '.claude/hooks/test/*.test.mjs'`.

## Commands (available from Phase 3 on, once the app is scaffolded)

- `npm run dev`: dev server
- `npm run check`: typecheck + lint + format check + unit tests (the per-module gate)
- `npm run test:coverage` / `npm run test:e2e`: coverage, and Playwright + axe
- `npm run build`: production build

Use Node LTS, as pinned in `.nvmrc`.

## Git

- Use Conventional Commits that cite IDs, e.g. `feat(todos): add create form (FR-002)` or `docs(waterfall): approve P1 requirements`.
- Commit only once the user has agreed a commit policy for this project; it's recorded in STATUS.md. Never push, deploy or create remote resources without asking. Force-push is denied.
- Never commit secrets. `.env` and `.env*.local` are git-ignored and unreadable by Claude.
