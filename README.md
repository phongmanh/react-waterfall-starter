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

## What's inside

| Path | Purpose |
|---|---|
| `CLAUDE.md` | Project instructions loaded into every Claude session |
| `.claude/skills/react-waterfall/` | The skill: the phase workflow, coding standards, stack setup, testing guide, and the templates for the documents each phase produces |
| `.claude/skills/{waterfall-status,approve,change-request}/` | Slash commands `/waterfall-status`, `/approve`, `/change-request` |
| `.claude/rules/` | Process rules (always loaded), plus TypeScript, React, testing and phase-doc rules that load when matching files are touched |
| `.claude/agents/phase-reviewer.md` | A read-only reviewer that checks each deliverable against its exit criteria before you are asked to sign off |
| `.claude/hooks/` | Hooks that enforce the gates (see below), with tests |
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
