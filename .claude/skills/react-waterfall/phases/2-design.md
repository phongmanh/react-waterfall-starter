# Phase 2: Design (how)
**Gate:** Design baseline (unlocks app code and scaffolding)
**Deliverable:** `docs/waterfall/02-design.md` from [the template](../assets/templates/02-design.md)
**Load:** [tech-stack](../references/tech-stack.md) §1–§2, [best-practices](../references/best-practices.md) (whole file), [testing](../references/testing.md) §1 (strategy); `01-requirements.md`

## Entry criteria
- P1 approved.

## Activities
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

Give each of these its own `##` or `###` heading, and have each build-order module cite the design sections it needs. P3 reads the design by section, so clear headings keep every later session cheap.

## Exit checklist
- [ ] Every FR maps to at least one design element
- [ ] Every significant choice has an ADR
- [ ] The build order is complete
- [ ] The user approves

## Pitfalls
- **Placeholder schemas or contracts.** P3 copies them into code, so they must be real.
- **Running the scaffolder** to "try something out" before approval. The phase gate blocks it.
