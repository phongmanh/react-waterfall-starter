---
paths:
  - "docs/waterfall/**"
---

# Phase documents

- Each document starts from its template in `.claude/skills/react-waterfall/assets/templates/`. Keep the template's sections and ID conventions.
- **STATUS.md layout is machine-read** by `.claude/hooks/`. Keep the Phases table's columns and order (`Phase | Deliverable | Status | Approved on | Notes`), one row per phase, and the `## Phases` and `## Change requests` headings. Use only these status values: `Not started`, `In progress`, `Awaiting approval`, `Approved`, `Approved (gate waived)`.
- Changing an approved document needs an approved CR. Bump the document's version, add a changelog line that cites the CR, then update everything downstream that it affects.
- No leftover placeholders (`<…>`, `TBD`). A section that doesn't apply says `N/A — <reason>`.
- Be concise and concrete: tables and bullets, real names, real schemas. Every requirement is testable and every NFR is measurable.
