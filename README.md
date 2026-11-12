# React Waterfall Starter

An empty project, set up so that [Claude Code](https://claude.com/claude-code) builds a **React + TypeScript web app** with the **Waterfall** method. The app is specified, designed, built, tested and shipped one approved phase at a time, using best-practice defaults.

```
P1 Requirements ─▶ P2 Design ─▶ P3 Implementation ─▶ P4 Testing ─▶ P5 Deployment ─▶ P6 Maintenance
   SRS               SDD + ADRs    code + log           test report    CI + hosting     runbook
       ▲ you approve      ▲ you approve     ▲ you approve      ▲ you approve    ▲ you approve
```

Every phase produces a document in `docs/waterfall/` and waits for your explicit sign-off. Changes to approved work go through logged change requests. Every requirement is traced through design and code to a passing test.

## Quick start

```bash
git clone git@github.com:phongmanh/react-waterfall-starter.git my-app
cd my-app
nvm use            # Node LTS from .nvmrc
claude
```

Then describe what you want, for example:

> Build a personal budgeting web app using the waterfall process.

Claude interviews you, writes `docs/waterfall/01-requirements.md`, and stops for your approval. Reply **approve** (or type `/approve`) to move on, or tell it what to change.

## Autopilot

To run the whole lifecycle without stopping for approvals:

```bash
node .claude/auto/waterfall-auto.mjs "Build a personal budgeting web app: accounts, monthly budgets, CSV import."
```

The runner starts one fresh headless Claude Code session (`claude -p`) per unit of work. Each session does its unit, rewrites the handoff in `STATUS.md` and exits; the next session starts clean from that handoff. It stops when the project is closed, when a session reports something only you can do (`BLOCKED: …`, then rerun with `--unblock`), or when a limit is reached. Run it again at any time to continue. For a longer brief, write `docs/waterfall/inputs/brief.md` yourself and run it with no argument.

Options are in `.claude/auto/config.json`. Put personal overrides in `.claude/auto/config.local.json` (git-ignored) or pass them as `--kebab-case=value`.

| Option | Default | Meaning |
|---|---|---|
| `stopAtGates` | `[]` | Phases that still wait for your `/approve`, e.g. `["P1","P2"]` to sign off the documents and automate the rest. Empty means no approvals. |
| `untilPhase` | `"P6"` | Stop once this phase is approved. |
| `onQuestion` | `"assume"` | `"assume"`: decide and record the assumption in the phase document. `"stop"`: block and wait for you. |
| `changeRequests` | `"auto"` | `"auto"`: log the CR and self-approve it as gate waived. `"stop"`: wait for your `/approve`. |
| `review` | `true` | Run the `phase-reviewer` agent before closing a phase. |
| `commit` | `"per-session"` | Commit each session's work locally, or `"none"`. It never pushes. |
| `brief` | `docs/waterfall/inputs/brief.md` | Where the brief lives. It replaces the Phase 1 interview. |
| `maxSessions` / `maxStalls` / `maxFailures` | `40` / `2` / `2` | Session cap per run; stop after sessions in a row that change nothing, or that fail. |
| `sessionTimeoutMinutes` | `90` | Kill a session that runs longer. |
| `maxBudgetUsd` | `null` | Stop when the run's total cost reaches this. |
| `pauseSeconds` | `0` | Wait between sessions. |
| `model` / `effort` | `null` | Passed to `claude`; `null` keeps the defaults. |
| `permissionMode` / `allowedTools` | `"acceptEdits"` + setup commands | What sessions may do without a prompt. Anything else is denied, since nobody is there to answer. |
| `extraPrompt` | `""` | Extra instructions for every session. |
| `logDir` / `quiet` / `claudeBin` | `.waterfall-auto/logs` / `false` / `claude` | Session logs (stream JSON), console verbosity, the CLI to run. |

Flags: `--dry-run` (print the next session's command and prompt), `--once` (one session), `--unblock`, `--help`. Exit codes: `0` done, `1` error, `2` needs you, `3` limit reached, `4` stalled.

Waived gates are recorded as `Approved (gate waived)` with a sign-off log row that cites the config, so the documents never claim an approval you didn't give. The phase-gate hook, the doc protection and the push/deploy restrictions all still apply. Phase 5 writes the CI and hosting config and documents the push and deploy commands for you to run.

## What's inside

| Path | Purpose |
|---|---|
| `CLAUDE.md` | Project instructions loaded into every Claude session |
| `.claude/skills/react-waterfall/` | The skill: the phase workflow, coding standards, stack setup, testing guide, UI/UX process, default design style, and the templates for the documents each phase produces |
| `.claude/skills/{waterfall-status,approve,change-request}/` | Slash commands `/waterfall-status`, `/approve`, `/change-request` |
| `.claude/rules/` | Process rules (always loaded), plus TypeScript, React, testing and phase-doc rules that load when matching files are touched |
| `.claude/agents/phase-reviewer.md` | A read-only reviewer that checks each deliverable against its exit criteria before you are asked to sign off |
| `.claude/hooks/` | Hooks that enforce the gates (see below), with tests |
| `.claude/auto/` | The autopilot runner and its `config.json` (see above) |
| `.claude/settings.json` | Hook wiring and permissions. npm scripts and tests run without prompts; push and deploy always ask; force-push and reading `.env` secrets are denied. |
| `.github/` | PR template and CI for the hooks. The app's own CI is generated in Phase 5. |

## Guardrails

| | |
|---|---|
| **Phase gate** | No app code, scaffolding or `npm install` until the Design phase is approved. No CI or deploy config until Testing is approved. |
| **Doc protection** | Blocks `create-vite --overwrite` and `rm -rf docs`, which would wipe the baselined documents. |
| **Auto-format + lint** | Once the app is scaffolded, every file Claude edits is formatted with Prettier and linted with oxlint. Errors go straight back to Claude. |
| **Session context** | Each session starts with the current phase status, so work resumes exactly where it stopped. |

To bypass the phase gate yourself (for example, for a spike), add this to `.claude/settings.local.json`, which is git-ignored:

```json
{ "env": { "WATERFALL_GATE": "off" } }
```

## Default stack

Vite · React 19 · TypeScript (strict) · React Router · TanStack Query · Zod · React Hook Form · Tailwind CSS v4 · oxlint (type-aware) · Prettier · Vitest + Testing Library + MSW · Playwright + axe. Details and alternatives: `.claude/skills/react-waterfall/references/tech-stack.md`. If a requirement calls for a different choice, the Design phase records it as an ADR.

## Developing the tooling

```bash
node --test '.claude/hooks/test/*.test.mjs'
```
