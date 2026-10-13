---
name: react-waterfall
description: Builds a React + TypeScript web app end to end with the Waterfall SDLC — Requirements → Design → Implementation → Testing → Deployment → Maintenance — writing one deliverable per phase into docs/waterfall/ and stopping for the user's explicit sign-off before each next phase, with requirement-to-test traceability and verified best-practice defaults (Vite, React 19, strict TypeScript, React Router, TanStack Query, Zod, Tailwind, oxlint, Vitest, Playwright + axe). Use this whenever the user wants to build, create, plan or spec a React or TypeScript web app, SPA, dashboard or frontend using a waterfall, phased, stage-gated, SDLC, spec-first or "requirements and design before code" process; asks for an SRS, design document or traceability matrix for a React app; or wants to resume, change or extend a project that already has docs/waterfall/STATUS.md — even if they don't say "waterfall". Not for a quick one-off component or throwaway prototype with no process wording.
---

# React Waterfall

Build a React + TypeScript web app the Waterfall way: six phases, strictly in order, each ending in a written deliverable that the user signs off before the next phase starts. The documents are the contract — later phases implement exactly what earlier phases approved, and every requirement is traced through design and code to a passing test.

The point of the method is to make decisions once, in writing, at the cheapest moment. A missing requirement costs a sentence in Phase 1, a diagram in Phase 2, and a rewrite in Phase 3. So this skill front-loads the thinking and never speeds past a gate.

```
P1 Requirements ─▶ P2 Design ─▶ P3 Implementation ─▶ P4 Testing ─▶ P5 Deployment ─▶ P6 Maintenance
 01-requirements    02-design     code +               04-test-       05-deployment    06-maintenance
                                  03-implementation-log  report                         + README → closed
        ▲ gate          ▲ gate          ▲ gate             ▲ gate         ▲ gate           ▲ gate
```

Every deliverable lives in `<project>/docs/waterfall/`, next to `STATUS.md`, which records the current phase, sign-offs and change requests. STATUS.md is what lets a later session pick up exactly where this one stopped.

## Start or resume

1. **Find the project directory.** If the user hasn't named one and the working directory isn't obviously it, ask. For a new app, propose `./<app-name>/`. Never scaffold into a home directory or into an unrelated repo.
2. **Resume** if `<project>/docs/waterfall/STATUS.md` exists: read it and every approved phase document, tell the user in one or two lines where things stand, and continue the current phase. Don't redo approved work.
3. **Start fresh** otherwise: create `docs/waterfall/`, copy `assets/templates/STATUS.md` from this skill into it, fill in the project name and today's date, and begin Phase 1.

Each phase starts by copying its template from `assets/templates/` and filling it in. Remove the `<!-- guidance -->` comments as you go. Write `N/A — <reason>` for sections that genuinely don't apply, so a reader can tell "considered and excluded" from "forgotten". Scale the depth to the app: a small app's design doc can be two pages.

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

---

## Phase 1 — Requirements (what, not how)

**Entry:** STATUS.md exists. **Template:** `assets/templates/01-requirements.md`.

1. **Interview.** Use AskUserQuestion for choices (up to 4 questions per round) and plain questions for open-ended answers. Cover:
   - purpose and measurable success criteria
   - users and roles
   - features, as user stories
   - the data the app handles
   - backend/APIs: does a backend exist? Is there a contract? How does auth work?
   - authorization rules
   - NFRs: performance, accessibility, browser/device support, i18n, security and privacy, offline
   - constraints: deadline, hosting, budget, existing code or design system
   - what is explicitly out of scope
2. **Propose defaults; don't interrogate.** Offer a sensible default the user can accept or correct, e.g. "WCAG 2.2 AA, last 2 versions of evergreen browsers, English only, LCP < 2.5 s". Two or three rounds of questions is usually enough.
3. **Write testable requirements.** Each FR describes one behaviour with an observable outcome and has at least one Given/When/Then acceptance criterion. NFRs must be measurable ("INP < 200 ms", not "fast"). Prioritise with MoSCoW.
4. **Record** assumptions, constraints, out-of-scope items, and open questions with an owner.

**Exit:** every FR has acceptance criteria, every NFR is measurable, out-of-scope is listed, open questions are resolved or explicitly deferred, and the user approves.

## Phase 2 — Design (how)

**Entry:** P1 approved. **Template:** `assets/templates/02-design.md`. **Read first:** `references/tech-stack.md`, `references/best-practices.md`, and `references/testing.md` (strategy section).

Decide and document:
- **Stack.** The default Vite SPA stack, unless a requirement rules it out (see tech-stack.md, "When to deviate"). Every deviation or notable choice gets an ADR (Context / Decision / Consequences / Alternatives).
- **Architecture overview.** A small text diagram showing the browser app, API, auth provider and hosting.
- **Folder structure** (feature-based, per best-practices.md) and **module boundaries**.
- **Route map:** path → page component → auth required → FR IDs.
- **Component hierarchy** per page, marking shared vs feature components.
- **Data model.** Zod schemas with the inferred TypeScript types, written out in full. They are copied into code in P3, so they must be real.
- **API contract.** Each endpoint with its method, request/response schema and error responses. If no backend exists yet, this is the MSW mock contract that stands in for it.
- **State strategy.** Classify every piece of state (server / URL / form / local UI / shared client) per best-practices.md.
- **UX states.** Loading, empty, error and success states for every async view, plus where the error boundaries go.
- **Cross-cutting:** auth flow and token handling, security measures, the accessibility approach, the performance budget (all derived from the NFRs).
- **Test strategy:** levels, tools and coverage targets (see testing.md).
- **Build order for P3.** A numbered list of modules, each naming the FRs it delivers, ordered by dependency: foundation/config → schemas & types → API layer → shared UI → features → app shell & routing.

**Exit:** every FR maps to at least one design element, every significant choice has an ADR, the build order is complete, and the user approves.

## Phase 3 — Implementation

**Entry:** P2 approved. **Template:** `assets/templates/03-implementation-log.md`. Re-read `02-design.md`, because it is the spec.

1. **Scaffold and configure** per `references/tech-stack.md` → "Project setup". It covers scaffolding safely next to the existing `docs/`, installing the stack, the strict tsconfig, lint, format, test config, scripts and Node version. Record the resolved major versions in the log.
2. **Version control.** If the project isn't a git repo, offer to `git init`. Suggest a commit at each module boundary (Conventional Commits). Commit only once the user agrees; that agreement can cover the whole project, so note it in STATUS.md.
3. **Build modules in the design's order.** For each module:
   - Implement it exactly as designed, following best-practices.md.
   - Write its unit/component tests alongside it, with titles carrying AC IDs.
   - Run `npm run check` (typecheck + lint + format check + unit tests). Fix failures before starting the next module; never stack new code on a red build.
   - Walk the review checklist at the end of best-practices.md.
   - Append a row to the implementation log: module, FRs, files, tests, notes and deviations.
4. **Deviations.** You may decide internal details the design left open, such as helper names, private sub-components or local variables, and log them. Anything visible in the design doc (routes, schemas, contracts, component boundaries, libraries) needs a CR.
5. **Finish** with `npm run build` succeeding and the app working under `npm run dev`. Offer to start the dev server so the user can click through before signing off.

**Exit:** every build-order module is done, `npm run check` and `npm run build` pass, every FR lists its implementing files, and the user approves.

## Phase 4 — Testing & verification

**Entry:** P3 approved. **Template:** `assets/templates/04-test-report.md`. **Read:** `references/testing.md`.

1. Run the unit/component suite with coverage (`npm run test:coverage`).
2. Write and run the Playwright E2E suite: at least one test per acceptance criterion that describes a user flow, plus an axe scan of every route (`npm run test:e2e`).
3. Verify each NFR with the method the requirements named: bundle size against budget, Lighthouse for performance NFRs, a keyboard-only walkthrough of core flows, and responsive checks at the specified breakpoints.
4. Log every failure as `DEF-###` (severity, requirement, steps, status). Fix it, then re-run the affected suites. A fix that changes design or requirements is a CR.
5. Fill the RTM: for each FR/NFR, record the design reference, files, tests and Pass/Fail.

Report only real results: paste or summarise actual command output. If something couldn't be run (no browser, no network), say so in the report and mark it as not verified. Don't estimate a result.

**Exit:** all Must-have requirements pass, no Critical or High defects are open (the user explicitly accepts any lower-severity ones that remain), coverage meets its target or the gap is justified, and the user approves.

## Phase 5 — Deployment

**Entry:** P4 approved. **Template:** `assets/templates/05-deployment.md`.

1. Confirm the hosting target if the requirements didn't fix it: Vercel, Netlify, GitHub Pages / any static host, or Docker + nginx.
2. Add CI (GitHub Actions by default; workflow in tech-stack.md): install → typecheck → lint → format check → unit tests with coverage → build → E2E.
3. Add the hosting config: SPA fallback to `index.html`, long-cache headers for hashed assets, and security headers including a CSP.
4. Document every environment variable. Anything prefixed `VITE_` is compiled into the public bundle, so it must never hold a secret.
5. Set the version to `1.0.0`, start a `CHANGELOG.md`, and write the release checklist and rollback procedure.
6. **Deploying, pushing, creating remote repos and setting cloud secrets are outward-facing.** Before each one, state exactly what will run and wait for explicit confirmation. If the user prefers to do it themselves, give them the exact commands.

**Exit:** CI passes (or the same steps pass locally if there's no remote yet), the app is deployed or the manual deploy steps are documented, rollback is documented, and the user approves.

## Phase 6 — Maintenance & handover

**Entry:** P5 approved. **Template:** `assets/templates/06-maintenance.md`.

1. Write the project `README.md`: what the app is, prerequisites (Node version), setup, scripts, folder structure, and a link to `docs/waterfall/`.
2. Fill in the maintenance doc:
   - runbook: run, build, deploy, roll back
   - known issues and limitations
   - accepted defects
   - dependency update policy
   - monitoring
   - change process: small changes are a CR against the baselined docs; a major version starts a new waterfall cycle
3. Mark every phase final and the project `Closed — v1.0.0` in STATUS.md, then ask for the closing sign-off.

**After closure,** any new request on this project ("add dark mode") is a CR or a new cycle. Re-enter at Phase 1 with that change; don't edit the code directly.

---

## Guardrails
- Write no `any`, `@ts-ignore`, or disabled lint rule without a comment explaining why. List each such exception in the implementation log.
- Don't pin versions from memory. Install current stable releases and let `package.json` and the lockfile be the record. If a command or config in the references no longer matches a tool's current docs, follow the docs and note the change in the log.
- Keep documents tight: tables and bullets, concrete names, no filler. A reviewer should be able to read any phase doc in about ten minutes.
- Re-read the approved documents at the start of each phase instead of relying on memory. In long sessions, earlier context may have been summarised.
- Never fabricate test output, coverage, Lighthouse scores or deploy results.

## Reference map

| File | When to read |
|---|---|
| `references/best-practices.md` | Before P2; consult throughout P3; use its checklist per module |
| `references/tech-stack.md` | P2 (stack decisions and ADRs), P3 setup, P5 CI and hosting |
| `references/testing.md` | P2 (test strategy), P3 (unit tests), P4 (full verification) |
| `assets/templates/*.md` | At the start of each phase, copied into `docs/waterfall/` |
