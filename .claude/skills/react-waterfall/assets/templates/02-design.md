# Software Design Document — <Project name>

| Version | Date | Implements | Status |
|---|---|---|---|
| 1.0 | <YYYY-MM-DD> | 01-requirements.md v<x> | Draft |

**Changelog:** 1.0 — initial baseline.

## 1. Overview & architecture
<!-- Small text diagram: browser SPA, API, auth provider, CDN/host. -->
```
[Browser: React SPA] ──HTTPS──▶ [API <base URL>] ──▶ [DB]
        │
        └── static assets from <host/CDN>
```

## 2. Technology stack
<!-- Default stack from references/tech-stack.md; list deviations with ADR refs. Record resolved versions in the implementation log. -->

| Concern | Choice | ADR |
|---|---|---|
| Build | Vite | — |
| UI | React 19 | — |
| … | | |

## 3. Folder structure & module boundaries
```
src/
  app/  routes/  features/<feature>/{api,components,hooks,schemas.ts,index.ts}
  components/ui/  lib/  test/
```
<!-- List features and what each owns. -->

## 4. Routes

| Path | Page component | Auth | Data loaded | FRs |
|---|---|---|---|---|
| `/` | `HomePage` | No | todos list | FR-001 |

## 5. Components
<!-- Per page: hierarchy; mark (ui) shared vs (feature). Note props for non-trivial components. -->
```
HomePage
└── TodoList (feature: todos)
    └── TodoItem (feature: todos)
        └── Checkbox (ui)
```

## 6. Data model
<!-- Real Zod schemas — copied into code in P3. -->
```ts
export const TodoSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  done: z.boolean(),
})
export type Todo = z.infer<typeof TodoSchema>
```

## 7. API contract
<!-- If no backend exists yet, this is the MSW mock contract and the spec the backend must meet. -->

| Method & path | Request | Response (2xx) | Errors | FRs |
|---|---|---|---|---|
| `GET /api/todos` | — | `TodoSchema[]` | 401, 500 | FR-001 |

## 8. State strategy

| State | Kind (server / URL / form / local / shared) | Where | Notes |
|---|---|---|---|
| Todo list | Server | TanStack Query `todoKeys.all` | invalidated after create |

## 9. UX states & error handling

| View | Loading | Empty | Error | Notes |
|---|---|---|---|---|
| TodoList | `<output>` "Loading todos…" | "No todos yet." + CTA | alert + Retry | |

Error boundaries: <per route in router config; root fallback; widgets wrapped: …>

## 10. Cross-cutting concerns
- **Authentication & authorization:** <flow, token storage (prefer HttpOnly cookie), route guards are UX only>
- **Security:** <CSP origins, input handling, sanitisation needs>
- **Accessibility:** <landmarks, focus management on route change, dialog primitive>
- **Performance:** <route splitting, budget, virtualisation needs>
- **Environment variables:** <name — purpose — public (VITE_) or server-only>

## 11. Test strategy
<!-- From references/testing.md: levels, tools, coverage targets, E2E browsers/viewports, what's mocked. -->

## 12. Build order (Phase 3 plan)

| # | Module | Delivers | Depends on |
|---|---|---|---|
| 1 | Foundation: scaffold, config, http client, test setup | — | — |
| 2 | Schemas & types | FR-… | 1 |
| 3 | API layer (query hooks, MSW handlers) | FR-… | 2 |
| 4 | Shared UI components | — | 1 |
| 5 | Feature: <name> | FR-… | 3, 4 |
| 6 | App shell & routing | FR-… | 5 |

## 13. Requirements coverage
<!-- Every FR/NFR → design section(s). Any FR without a row blocks the gate. -->

| Req | Design sections |
|---|---|
| FR-001 | §4, §5, §7 |

## 14. Architecture Decision Records

### ADR-001 — <decision title>
- **Status:** Accepted
- **Context:** <forces, requirement IDs>
- **Decision:** <what we chose>
- **Alternatives:** <what we didn't, and why>
- **Consequences:** <trade-offs accepted>
