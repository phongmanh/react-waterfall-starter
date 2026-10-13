---
paths:
  - "src/**/*.test.{ts,tsx}"
  - "src/test/**"
  - "e2e/**"
---

# Testing rules

Full guide: `.claude/skills/react-waterfall/references/testing.md`. The non-negotiables:

- Every test title starts with the requirement ID it verifies: `it('AC-003.2 shows an error when the title is empty', …)`. The RTM is built by grepping these IDs.
- Test behaviour, not implementation. Query by role (with `name`), then by label, then by text. Use `getByTestId` only as a last resort.
- Use `userEvent` for interaction and `findBy*` / `waitFor` for async. Never sleep or call `waitForTimeout`.
- Mock HTTP with MSW handlers that follow the design's API contract. `onUnhandledRequest: 'error'` stays on.
- Cover all four async states, plus every validation rule, for each view and form.
- E2E: at least one Playwright test per user-flow acceptance criterion, and an axe scan (WCAG 2.2 AA tags) on every route. Import `{ AxeBuilder }` as a named import.
- A defect fix adds a regression test that carries the AC or DEF ID.
