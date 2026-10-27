# Phase 1: Requirements (what, not how)
**Gate:** Requirements baseline
**Deliverable:** `docs/waterfall/01-requirements.md` from [the template](../assets/templates/01-requirements.md)
**Load:** nothing beyond this file and STATUS.md

## Entry criteria
- `docs/waterfall/STATUS.md` exists.

## Activities
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

## Exit checklist
- [ ] Every FR has acceptance criteria
- [ ] Every NFR is measurable
- [ ] Out-of-scope is listed
- [ ] Open questions are resolved or explicitly deferred
- [ ] The user approves

## Pitfalls
- **Designing early.** Implementation ideas the user volunteers go in as constraints, not decisions. No scaffolding, no code.
- **Unmeasurable NFRs** ("fast", "secure") that P4 can't verify.
