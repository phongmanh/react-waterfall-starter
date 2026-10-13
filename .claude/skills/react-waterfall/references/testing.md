# Testing & verification

Used in P2 (writing the test strategy), P3 (unit/component tests next to each module) and P4 (full verification and the test report).

Contents: 1. Strategy · 2. Unit & component tests · 3. API mocking · 4. E2E & accessibility · 5. NFR verification · 6. Defects · 7. Traceability matrix

## 1. Strategy (copy the relevant parts into 02-design.md)

| Level | Tool | What belongs here | When |
|---|---|---|---|
| Unit | Vitest | Pure logic: schemas, formatters, reducers, custom hooks (`renderHook`) | P3, with each module |
| Component / integration | Vitest + Testing Library + MSW | A feature's components with real hooks and mocked HTTP: rendering states, user interaction, form validation | P3, with each module |
| End-to-end | Playwright | Each user-flow acceptance criterion, run against the production build in a real browser | P4 |
| Accessibility | axe via `@axe-core/playwright`, plus a manual keyboard pass | Every route; WCAG tags from the NFR | P4 |
| NFR checks | Lighthouse, build output, manual | Performance, bundle budget, responsiveness, browser support | P4 |

Coverage targets (enforced in `vite.config.ts`): **≥ 80% lines, functions and statements, and ≥ 75% branches** over `src/features` and `src/lib`. The app shell and routes are covered by E2E rather than unit coverage. Coverage is a floor, not the goal. The goal is that every AC has a test that would fail if the behaviour broke.

**Naming rule:** every test title starts with the ID it verifies (`AC-001.2 …`, `NFR-004 …`). Use `describe` for the unit under test.

## 2. Unit & component tests

Setup (`src/test/setup.ts`):
```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())
```

Render helper (`src/test/render.tsx`). Give each test a fresh QueryClient with retries off so error states appear immediately:
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>, options)
}
```
Add a `MemoryRouter` wrapper when a component under test uses router hooks.

Component test:
```tsx
describe('TodoList', () => {
  it('AC-001.3 shows an error with a retry button when loading fails', async () => {
    server.use(http.get('/api/todos', () => new HttpResponse(null, { status: 500 })))
    renderWithProviders(<TodoList />)
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load todos.")

    server.resetHandlers()
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Write SRS')).toBeInTheDocument()
  })
})
```

Hook test:
```tsx
const { result } = renderHook(() => useCreateTodo(), { wrapper })
result.current.mutate({ title: 'Design' })
await waitFor(() => expect(result.current.isSuccess).toBe(true))
```

Rules:
- **Test behaviour, not implementation.** Assert what the user sees and does, not internal state, hook calls or class names.
- **Query priority:** `getByRole` (with `name`) → `getByLabelText` → `getByText` → `getByTestId` as a last resort. If an element can't be found by role or label, that is often an accessibility bug.
- Use `userEvent` (not `fireEvent`) for interaction, and `findBy*` / `waitFor` for async. Never use arbitrary sleeps.
- **Cover all four async states** (loading, error, empty, success) for every async view. Also cover validation messages for every form rule.
- Follow Arrange–Act–Assert with one behaviour per test. Tests must not depend on each other's order.

## 3. API mocking with MSW

`src/test/server.ts` holds the default happy-path handlers, written from the API contract in 02-design.md:
```ts
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

export const handlers = [
  http.get('/api/todos', () => HttpResponse.json([{ id: '1', title: 'Write SRS', done: false }])),
]
export const server = setupServer(...handlers)
```
Override per test with `server.use(...)` for error, empty and edge cases. `onUnhandledRequest: 'error'` makes a request the contract doesn't cover fail the test. That is a contract gap: fix the design or the code, through a CR if it changes the contract.

## 4. E2E & accessibility (Playwright)

The config is in tech-stack.md §4. It builds and serves the production bundle, so E2E tests what ships.

```ts
import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Stub the API at the network layer unless a real test backend is specified.
  await page.route('**/api/todos', (route) =>
    route.fulfill({ json: [{ id: '1', title: 'Write SRS', done: false }] }),
  )
})

test('AC-001.1 home page lists todos', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Todos' })).toBeVisible()
  await expect(page.getByText('Write SRS')).toBeVisible()
})

test('NFR-002 home page has no WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Write SRS')).toBeVisible() // scan the loaded state, not the spinner
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(results.violations).toEqual([])
})
```

Rules:
- Write at least one E2E test per acceptance criterion that describes a user flow, and run an axe scan on every route in each meaningful state (e.g. with a dialog open).
- Use web-first assertions (`await expect(locator).toBeVisible()`) with role-based locators. Never use `waitForTimeout`.
- Use the import `{ AxeBuilder }` (named). The default import fails to typecheck under `nodenext`.
- Run headless Chromium by default. Add browsers and viewports to match the browser-support NFR.
- **Manual keyboard pass:** tab through each core flow and check focus order, visible focus, Escape behaviour, and that no keyboard traps exist. Record the result in the test report.

## 5. NFR verification

| NFR type | How to verify | Evidence in report |
|---|---|---|
| Performance (LCP/INP/CLS) | Lighthouse on `npm run preview` (mobile preset), or the method the NFR names | Scores and metric values |
| Bundle budget | `npm run build` output (gzip sizes per chunk) | The table from build output |
| Accessibility | axe E2E plus the manual keyboard pass | Pass/fail per route |
| Browser support | Playwright projects for each required browser | Test run summary |
| Responsiveness | Playwright at the required viewports, or a manual check | Pass/fail per breakpoint |
| Security | `npm audit --audit-level=high`, header check on the deployed or preview build | Command output |

Report actual numbers only. If a check couldn't be run, mark it **Not verified**, give the reason, and leave the status unresolved for the user's sign-off decision.

## 6. Defects

Log every failure found in P4 in the test report:

| ID | Severity | Req | Summary | Steps to reproduce | Status |
|---|---|---|---|---|---|
| DEF-001 | High | FR-003 | Empty title accepted | 1. Open form 2. Submit blank | Fixed in `TodoForm.tsx`, re-tested |

Severity scale:
- **Critical:** data loss, security hole, or app unusable.
- **High:** a Must requirement fails.
- **Medium:** a Should requirement fails, or the bug has a workaround.
- **Low:** cosmetic.

Fix, then re-run the affected suites, and add a regression test that carries the AC ID. A fix that changes design or requirements is a CR.

## 7. Requirements Traceability Matrix

One row per FR and NFR. The P4 gate needs every Must row to be Pass.

| Req | Priority | Design ref | Implementation | Tests | Status |
|---|---|---|---|---|---|
| FR-001 | Must | §Routes `/`, §Components TodoList | `src/features/todos/components/TodoList.tsx` | `TodoList.test.tsx` (AC-001.1–3), `e2e/home.spec.ts` (AC-001.1) | Pass |
| NFR-002 | Must | §Accessibility | all routes | `e2e/home.spec.ts` (axe), manual keyboard pass | Pass |

Build the table from the test titles: `grep -rhoE "(AC|FR|NFR)-[0-9]+(\.[0-9]+)?" src e2e | sort -u`. Any requirement ID that is missing from the output has no test.
