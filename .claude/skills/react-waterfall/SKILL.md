---
name: react-waterfall
description: Builds a React + TypeScript web app with the Waterfall SDLC (Requirements → Design → Implementation → Testing → Deployment → Maintenance), one signed-off deliverable per phase in docs/waterfall/, with requirement-to-test traceability. Use when the user wants a phased, stage-gated or spec-first React/TypeScript app, an SRS, design doc or traceability matrix for one, or to resume or change a project with docs/waterfall/STATUS.md. Not for one-off components or throwaway prototypes.
---

# React Waterfall

Build a React + TypeScript web app the Waterfall way: six phases, strictly in order, each ending in a written deliverable that the user signs off before the next phase starts. The documents are the contract — later phases implement exactly what earlier phases approved, and every requirement is traced through design and code to a passing test.

The point of the method is to make decisions once, in writing, at the cheapest moment. A missing requirement costs a sentence in Phase 1, a diagram in Phase 2, and a rewrite in Phase 3. So this skill front-loads the thinking and never speeds past a gate.

## Lifecycle

| # | Phase | Deliverable in `docs/waterfall/` | Gate |
|---|---|---|---|
| P1 | [Requirements](phases/1-requirements.md) (what, not how) | `01-requirements.md` | Requirements baseline |
| P2 | [Design](phases/2-design.md) (how) | `02-design.md` | Design baseline; unlocks app code |
| P3 | [Implementation](phases/3-implementation.md) | Code, `03-implementation-log.md` | Code complete |
| P4 | [Testing & verification](phases/4-testing.md) | `04-test-report.md` (with the RTM) | Release readiness; unlocks CI and deploy config |
| P5 | [Deployment](phases/5-deployment.md) | `05-deployment.md`, CI, hosting config | Deployed |
| P6 | [Maintenance & handover](phases/6-maintenance.md) | `06-maintenance.md`, `README.md` | Project closed |

Every deliverable lives in `<project>/docs/waterfall/`, next to `STATUS.md`, which records the current phase, sign-offs and change requests. STATUS.md is what lets a later session pick up exactly where this one stopped.

## Start or resume

1. **Find the project directory.** If the user hasn't named one and the working directory isn't obviously it, ask. For a new app, propose `./<app-name>/`. Never scaffold into a home directory or into an unrelated repo.
2. **Resume** if `<project>/docs/waterfall/STATUS.md` exists: read it, tell the user in one or two lines where things stand, and continue the current phase. Don't redo approved work.
3. **Start fresh** otherwise: create `docs/waterfall/`, copy `assets/templates/STATUS.md` from this skill into it, fill in the project name and today's date, and begin Phase 1.
4. **Load only what's needed:** the current phase's file and what its **Load** line lists. Don't open other phase files, and don't read approved documents or references whole when the phase file says to read sections (see [Reading on demand](#reading-on-demand)). If STATUS.md doesn't show the previous phase as approved, stop and say so.

Each phase starts by copying its template from `assets/templates/` and filling it in. Remove the `<!-- guidance -->` comments as you go. Write `N/A — <reason>` for sections that genuinely don't apply, so a reader can tell "considered and excluded" from "forgotten". Scale the depth to the app: a small app's design doc can be two pages.

**Partial use.** If the user wants a single deliverable (e.g. "write the SRS for this app"), produce just that one, following its phase file. Mention any missing upstream inputs, but don't force the whole lifecycle.

## Rules that hold in every phase

### 1. One phase at a time
Do only the current phase's work. In P1 and P2, write no application code and don't run the scaffolder. A premature `npm create vite` anchors decisions the design hasn't made yet. If the user volunteers an implementation idea early, record it in the doc (as a constraint in P1, or a design note to revisit in P2) and keep going.

### 2. Hard sign-off gates
When a phase deliverable is complete:
1. If the project defines a `phase-reviewer` agent, run it on the deliverable first, fix every blocking finding, and mention any non-blocking ones in your summary.
2. Set the phase to `Awaiting approval` in STATUS.md.
3. Present: the document path, a 5–10 line summary of what it decides, open risks or questions, and what the next phase will do.
4. Ask explicitly, e.g. *"Reply **approve** to sign off Phase 1, or tell me what to change."* Then **end your turn**.

Only an unambiguous yes about this phase counts as approval: "approve", "approved", "LGTM", "looks good, go ahead". Feedback, a question, or an unrelated reply is not approval. Revise, re-present and ask again. On approval, set the phase to `Approved`, log the date and the user's words in the sign-off table, then start the next phase.

The gates are the user's to waive, not yours. If the user is in a hurry, offer leaner documents, but keep the gate. Only if the user explicitly says not to stop between phases: honour it, record the waiver in STATUS.md's Gate policy row, mark each finished phase `Approved (gate waived)`, and still write every deliverable.

Keep STATUS.md's table layout exactly as in the template: same columns, one row per phase, status in the third column. Project tooling (hooks) may parse it.

### 3. Change requests
An approved document is baselined. Any change that affects behaviour, scope, architecture, data model, API contract or the stack goes through a change request:
1. Log `CR-###` in STATUS.md: what, why, and which documents, files and tests it affects.
2. Present it and get approval (same gate rules).
3. Update the upstream document (bump its version, add a changelog line), then ripple downstream: requirements → design → code → tests → RTM.

Typos, broken links and other corrections that don't change meaning need no CR. This matters because unlogged drift is how the docs stop being true, and stale docs make the traceability worthless. If you discover during P3 or P4 that the design is wrong, raise a CR. Don't silently code around it.

### 4. Traceability
- Functional requirements are `FR-001`, non-functional `NFR-001`, acceptance criteria `AC-001.1` (under FR-001). Decisions are `ADR-001`, defects `DEF-001`, change requests `CR-001`.
- IDs are never reused or renumbered. A dropped requirement becomes `Withdrawn (CR-###)`.
- Design elements cite the FR/NFR IDs they satisfy. The implementation log maps FRs to files.
- Test titles start with the ID they verify, e.g. `it('AC-003.2 shows an error when the title is empty', …)`, so `grep -r "AC-003"` finds the coverage.
- The Requirements Traceability Matrix (RTM) in `04-test-report.md` has a row for every FR and NFR.

### 5. Standards
`references/best-practices.md` is the coding standard, and `references/tech-stack.md` is the default stack and setup. If the target project has its own CLAUDE.md, lint config or conventions, those win where they conflict. Record each conflict in the design doc.

### Reading on demand
Approved documents, references and source files grow large. Reading them whole every session wastes context and pushes out what matters.
- **Documents and references:** list the headings first (`grep -n '^##' <file>`) and read only the ranges the task needs. Pull IDs with `grep` (e.g. `grep -n 'FR-012\|AC-012' docs/waterfall/01-requirements.md`).
- **Code:** don't `cat` whole folders to get oriented. Read a module's `index.ts` and list signatures with `grep -n '^export' <files>`. Open in full only the files you'll change or copy from, and read the rest by line range (`sed -n`).
- **Oversized output:** if a command's output is too large and gets saved to a file, don't read that file with `allow_large`. Rerun a narrower command.
- **Re-read instead of remembering.** At the start of a phase or session, re-read the sections you need instead of relying on memory, since earlier context may have been summarised.

## Guardrails
- Write no `any`, `@ts-ignore`, or disabled lint rule without a comment explaining why. List each such exception in the implementation log.
- Don't pin versions from memory. Install current stable releases and let `package.json` and the lockfile be the record. If a command or config in the references no longer matches a tool's current docs, follow the docs and note the change in the log.
- Keep documents tight: tables and bullets, concrete names, no filler. A reviewer should be able to read any phase doc in about ten minutes.
- Never fabricate test output, coverage, Lighthouse scores or deploy results.

## File index
- **Phases:** [1 Requirements](phases/1-requirements.md) · [2 Design](phases/2-design.md) · [3 Implementation](phases/3-implementation.md) · [4 Testing](phases/4-testing.md) · [5 Deployment](phases/5-deployment.md) · [6 Maintenance](phases/6-maintenance.md)
- **References.** Every reference file has numbered `##` sections. Find one with `grep -n '^## ' <file>` and read just that range.

  | File | When to read |
  |---|---|
  | `references/best-practices.md` | Whole file before P2. In P3, read only §15 (per-module checklist) per module, and a single section when a question comes up |
  | `references/tech-stack.md` | P2: §1–§2. P3 setup: §3–§5. P5: §6–§7 |
  | `references/testing.md` | P2: §1. P3: §2–§3. P4: §4–§7 |

- **Templates:** `assets/templates/*.md`, copied into `docs/waterfall/` at the start of each phase: [STATUS](assets/templates/STATUS.md) · [01-requirements](assets/templates/01-requirements.md) · [02-design](assets/templates/02-design.md) · [03-implementation-log](assets/templates/03-implementation-log.md) · [04-test-report](assets/templates/04-test-report.md) · [05-deployment](assets/templates/05-deployment.md) · [06-maintenance](assets/templates/06-maintenance.md)
