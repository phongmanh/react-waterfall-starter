# Test Report — <Project name>

| Version | Date | Build tested | Status |
|---|---|---|---|
| 1.0 | <YYYY-MM-DD> | <commit / description> | Draft |

## 1. Summary
<!-- 3–5 lines: overall result, open defects, anything not verified. -->

## 2. Results by level
<!-- Paste or summarise actual command output. Never estimate. -->

| Level | Command | Result | Notes |
|---|---|---|---|
| Typecheck + lint + format | `npm run check` | | |
| Unit / component | `npm run test:coverage` | <n passed / n total> | |
| E2E | `npm run test:e2e` | <n passed / n total> | browsers: |
| Accessibility (axe) | in E2E | <violations per route> | |
| Manual keyboard pass | — | | flows checked: |
| Production build | `npm run build` | | |

### Coverage (src/features, src/lib)

| Lines | Functions | Branches | Statements | Target met? |
|---|---|---|---|---|
| | | | | |

## 3. NFR verification

| NFR | Method | Measured | Target | Status |
|---|---|---|---|---|
| NFR-001 | Lighthouse (mobile) | | | |

<!-- Status: Pass · Fail · Not verified (reason) -->

## 4. Defects

| ID | Severity | Req | Summary | Steps | Status |
|---|---|---|---|---|---|
| | | | | | |

<!-- Severity: Critical / High / Medium / Low (references/testing.md §6). Open Medium/Low defects need explicit user acceptance at the gate. -->

## 5. Requirements Traceability Matrix
<!-- One row per FR and NFR. All Must rows Pass to exit P4. -->

| Req | Priority | Design ref | Implementation | Tests | Status |
|---|---|---|---|---|---|
| FR-001 | Must | | | | |
| NFR-001 | Must | | | | |

## 6. Not verified / limitations
-
