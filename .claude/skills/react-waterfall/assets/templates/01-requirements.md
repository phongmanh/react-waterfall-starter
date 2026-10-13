# Software Requirements Specification — <Project name>

| Version | Date | Author | Status |
|---|---|---|---|
| 1.0 | <YYYY-MM-DD> | Claude with <user> | Draft |

**Changelog:** 1.0 — initial baseline.

## 1. Purpose & success criteria
<!-- One paragraph: what problem this app solves and for whom. Then 2–4 measurable success criteria. -->
- SC-1:

## 2. Users & roles

| Role | Description | Key goals | Permissions |
|---|---|---|---|
| | | | |

## 3. Functional requirements
<!-- One observable behaviour per FR. Priority = MoSCoW (Must / Should / Could / Won't).
     Each FR has ≥1 acceptance criterion in Given/When/Then. IDs are permanent. -->

### FR-001 — <short name> (Must)
**User story:** As a <role>, I want <capability> so that <benefit>.

| AC | Given | When | Then |
|---|---|---|---|
| AC-001.1 | | | |
| AC-001.2 | | | |

### FR-002 — <short name> (Should)
**User story:** …

| AC | Given | When | Then |
|---|---|---|---|
| AC-002.1 | | | |

## 4. Non-functional requirements
<!-- Every NFR measurable and with a verification method. Defaults shown; adjust with the user. -->

| ID | Category | Requirement | Verification | Priority |
|---|---|---|---|---|
| NFR-001 | Performance | LCP < 2.5 s, INP < 200 ms, CLS < 0.1 on mobile (Fast 4G) | Lighthouse on production build | Must |
| NFR-002 | Accessibility | WCAG 2.2 AA on all routes | axe E2E + manual keyboard pass | Must |
| NFR-003 | Compatibility | Last 2 versions of Chrome, Edge, Firefox, Safari; 360 px – 1920 px wide | Playwright projects / viewports | Must |
| NFR-004 | Security | No secrets in client bundle; CSP + security headers; no high/critical `npm audit` findings | Review + header check + audit | Must |
| NFR-005 | Bundle size | Initial JS ≤ <N> kB gzip | `vite build` output | Should |
| NFR-006 | i18n | <English only / locales> | Review | |

## 5. Data
<!-- Entities the app reads/writes, key fields, ownership, retention, PII. -->

| Entity | Key fields | Source of truth | Notes (PII, limits) |
|---|---|---|---|
| | | | |

## 6. External interfaces
<!-- Backend APIs (existing? contract link?), auth provider, third-party services. If no backend exists yet, say so. -->

## 7. Constraints
<!-- Deadline, hosting, budget, mandated tech or design system, existing code. -->

## 8. Assumptions

## 9. Out of scope
<!-- Explicit list. Anything here needs a CR to come back in. -->
-

## 10. Open questions

| # | Question | Owner | Due | Resolution |
|---|---|---|---|---|
| | | | | |
