# Phase 4: Testing & verification
**Gate:** Release readiness (unlocks CI and deploy config)
**Deliverable:** `docs/waterfall/04-test-report.md` from [the template](../assets/templates/04-test-report.md), including the RTM
**Load:** [testing](../references/testing.md) §4–§7. As in P3, pull FRs, ACs and NFRs from the approved documents by `grep`, not by re-reading them whole.

## Entry criteria
- P3 approved.

## Activities
1. Run the unit/component suite with coverage (`npm run test:coverage`).
2. Write and run the Playwright E2E suite: at least one test per acceptance criterion that describes a user flow, plus an axe scan of every route (`npm run test:e2e`).
3. Verify each NFR with the method the requirements named: bundle size against budget, Lighthouse for performance NFRs, a keyboard-only walkthrough of core flows, and responsive checks at the specified breakpoints.
4. Log every failure as `DEF-###` (severity, requirement, steps, status). Fix it, then re-run the affected suites. A fix that changes design or requirements is a CR.
5. Fill the RTM: for each FR/NFR, record the design reference, files, tests and Pass/Fail.

Report only real results: paste or summarise actual command output. If something couldn't be run (no browser, no network), say so in the report and mark it as not verified. Don't estimate a result.

## Exit checklist
- [ ] All Must-have requirements pass
- [ ] No Critical or High defects are open, and the user explicitly accepts any lower-severity ones that remain
- [ ] Coverage meets its target, or the gap is justified
- [ ] The user approves

## Pitfalls
- **Estimated results.** Anything not actually run is marked not verified.
- **Fixes that quietly change behaviour.** Those are CRs, not defect fixes.
