# React + TypeScript best practices

The coding standard for P2 (design) and P3 (implementation). Where the target project has its own conventions (CLAUDE.md, lint config), those win; note the conflict in the design doc.

Contents: 1. Principles · 2. TypeScript · 3. Project structure · 4. Components · 5. Hooks & effects · 6. State · 7. Data fetching · 8. Forms · 9. Errors & async UI · 10. Accessibility · 11. Performance · 12. Security · 13. Styling · 14. Naming & style · 15. Per-module review checklist

## 1. Principles

- **Single responsibility.** A component renders, a hook holds logic, an API module talks HTTP, a schema validates. If a file does two of these, split it.
- **Open/closed through composition.** Extend a component with `children`, render props or slots, not with a growing list of boolean props.
- **Dependency inversion.** Components depend on hooks (`useTodos()`), never on `fetch` directly. That keeps them testable and lets the data source change.
- **Separation of concerns, one direction.** `routes → features → components/ui, lib`. Lower layers never import upward.
- **DRY, by the rule of three.** Duplicate once; abstract on the third occurrence. A wrong abstraction costs more than duplication.
- **KISS / YAGNI.** Build what the approved requirements say. A feature or extension point nobody asked for is scope creep, and in waterfall scope creep needs a CR.

## 2. TypeScript

- **Strict mode** with `noUncheckedIndexedAccess` (see tech-stack.md). `arr[0]` is `T | undefined`, and that is the point.
- **No `any`.** Use `unknown` and narrow it. Treat every external value (HTTP responses, `localStorage`, `postMessage`, URL params) as `unknown` until a Zod schema has parsed it.
- **Schemas are the source of truth.** Define the Zod schema and derive the type from it:
  ```ts
  export const TodoSchema = z.object({ id: z.string(), title: z.string().min(1), done: z.boolean() })
  export type Todo = z.infer<typeof TodoSchema>
  ```
- **Model states as discriminated unions** so impossible states can't be represented:
  ```ts
  type SaveState =
    | { status: 'idle' }
    | { status: 'saving' }
    | { status: 'error'; message: string }
    | { status: 'saved'; at: Date }
  ```
  Check exhaustiveness in a `switch` with `default: { const unreachable: never = state; return unreachable }`.
- **No `enum` and no `namespace`.** The template's `erasableSyntaxOnly` forbids them. Use a union of literals or an `as const` object:
  ```ts
  export const ROLES = ['admin', 'editor', 'viewer'] as const
  export type Role = (typeof ROLES)[number]
  ```
- **Use `satisfies`** for config objects, to check the shape while keeping literal types: `const routes = {...} satisfies Record<string, RouteDef>`.
- **Use `import type` for type-only imports.** `verbatimModuleSyntax` and the lint rule enforce it.
- **Avoid `!` (non-null assertion).** Guard instead and throw with a message: `if (!el) throw new Error('#root not found')`.
- **Give explicit return types** to exported functions and hooks that form a module's public API. Local code can rely on inference.
- **Don't use `React.FC`.** Type the props parameter directly.

## 3. Project structure (feature-based)

```
src/
  app/                 # App shell: providers, router, root layout
    App.tsx
    router.tsx
  routes/              # Route-level page components (lazy-loaded), RouteError
  features/
    <feature>/
      api/             # query/mutation hooks + query-key factory
      components/      # feature components (+ colocated *.test.tsx)
      hooks/           # feature logic hooks
      schemas.ts       # Zod schemas + inferred types
      index.ts         # the feature's public API
  components/ui/       # shared, presentational, feature-agnostic (Button, Field, Dialog)
  lib/                 # framework-agnostic helpers: http client, cn(), formatters
  test/                # setup.ts, MSW server/handlers, renderWithProviders
  main.tsx
e2e/                   # Playwright specs
```

Rules:
- Import across features only through the feature's `index.ts`. No deep imports like `@/features/todos/components/X` from another feature. `import/no-cycle` catches cycles.
- `components/ui` and `lib` never import from `features` or `routes`.
- Use the `@/` alias for cross-folder imports and relative imports inside a feature.
- Colocate tests: `TodoList.tsx` sits next to `TodoList.test.tsx`.
- Keep one small `index.ts` per feature. Avoid giant re-export-everything barrels; they slow the dev server and tests and hurt tree-shaking.

## 4. Components

- Write function components with a named props type, destructured in the signature:
  ```tsx
  type TodoItemProps = { todo: Todo; onToggle: (id: string) => void }
  export function TodoItem({ todo, onToggle }: TodoItemProps) { … }
  ```
- Wrap native elements by extending their props. In React 19, `ref` is a normal prop, so `forwardRef` isn't needed:
  ```tsx
  type ButtonProps = React.ComponentProps<'button'> & { variant?: 'primary' | 'secondary' }
  export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
    return <button className={cn(styles[variant], className)} {...props} />
  }
  ```
  Always set `type="button"` on non-submit buttons.
- Keep components small; roughly 150 lines is the point to split. Split by responsibility, e.g. a hook for data and logic plus a presentational component for markup.
- Pass intent callbacks down (`onComplete(id)`), not raw `setState` functions.
- Use stable keys from data IDs. Don't use the array index for lists that can reorder, insert or delete.
- Never define a component inside another component; it remounts on every render.
- Write conditional rendering safely: `{items.length > 0 && <List …/>}`, not `{items.length && …}`, which renders `0`.
- Name the file after the exported component in PascalCase (`TodoItem.tsx`), one exported component per file.

## 5. Hooks & effects

- The rules of hooks are lint-enforced (`react/rules-of-hooks`, `react/exhaustive-deps`). Fix the dependency array; don't suppress the rule.
- Extract logic into custom hooks (`useXxx`) that return data plus actions. They are testable with `renderHook`.
- **You probably don't need an effect.** Effects are for synchronising with something *outside* React: subscriptions, browser APIs, non-React widgets. Don't use them to:
  - derive values. Compute during render: `const visible = todos.filter(t => !t.done)`
  - copy props into state. Use the prop, or reset the component with `key`
  - respond to user events. Do it in the event handler
  - fetch data. Use TanStack Query
- Every subscription or timer in an effect returns a cleanup function.
- **Memoisation.** If the React Compiler is enabled, don't hand-write `useMemo`/`useCallback`/`memo`. If it isn't, memoise only when a Profiler measurement shows a problem, or when referential stability is required (for example, a value in another hook's dependency array).

## 6. State: put it in the right place

| Kind | Example | Where it lives |
|---|---|---|
| Server state | lists and records from the API | TanStack Query, never copied into `useState` |
| URL state | filters, sort, page, selected tab | Router search params (`useSearchParams`), so it is shareable and survives reload |
| Form state | field values, validation errors | React Hook Form |
| Local UI state | open/closed, hover, step | `useState` / `useReducer` in the lowest common owner |
| Shared client state | theme, current session | Context (rarely changing values) or Zustand (frequent updates) |

Keep a single source of truth, lift state only as high as needed, and derive everything else. Context re-renders every consumer on change, so it isn't a store for fast-changing values.

## 7. Data fetching & API layer

- Use **one HTTP client** in `src/lib/http.ts`. It takes the base URL from env, applies a timeout, throws a typed `HttpError` on non-2xx, and **parses every response with a schema**:
  ```ts
  async function request<T>(path: string, schema: z.ZodType<T>, init: RequestInit = {}): Promise<T> {
    const signal = init.signal
      ? AbortSignal.any([init.signal, AbortSignal.timeout(TIMEOUT_MS)])
      : AbortSignal.timeout(TIMEOUT_MS)
    const headers = new Headers(init.headers) // never spread HeadersInit; it may be an array
    headers.set('Content-Type', 'application/json')
    const res = await fetch(`${BASE_URL}${path}`, { ...init, signal, headers })
    if (!res.ok) throw new HttpError(res.status, `${init.method ?? 'GET'} ${path} failed: ${res.status}`)
    const body: unknown = res.status === 204 ? undefined : await res.json()
    return schema.parse(body)
  }
  ```
- Give each feature a **query-key factory** and query/mutation hooks:
  ```ts
  export const todoKeys = { all: ['todos'] as const, detail: (id: string) => ['todos', id] as const }

  export function useTodos() {
    return useQuery({ queryKey: todoKeys.all, queryFn: ({ signal }) => http.get('/todos', TodoListSchema, signal) })
  }
  export function useCreateTodo() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (todo: NewTodo) => http.post('/todos', todo, TodoSchema),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: todoKeys.all }),
    })
  }
  ```
- Pass `signal` through for cancellation. Set QueryClient defaults deliberately (`staleTime`, `retry`) and don't retry 4xx responses.
- Use optimistic updates only where a requirement asks for instant feedback, and always roll back on error.

## 8. Forms

- Use React Hook Form + `zodResolver(schema)`, reusing the API schema (or a `.pick`/`.extend` of it) so client and server validation agree.
- Give every input a visible `<label>`. Link errors with `aria-describedby` and set `aria-invalid`. On a failed submit, move focus to the first invalid field.
- Disable submit while pending, show the server error, and prevent double submission.
- React 19 Actions (`<form action>`, `useActionState`) suit simple forms without client validation. Pick one approach per project and record it in an ADR.

## 9. Errors & async UI

- **Every async view renders four states:** loading (`<output>` text or a skeleton), error (a human message plus Retry, `role="alert"`), empty (an explanation plus the next action), and success.
- **Error boundaries.** Each route gets an `ErrorBoundary` in the router config. Use `react-error-boundary` around risky widgets, plus a root fallback.
- **Never swallow errors.** Catch, show a user-friendly message, and report it (console in dev; the error-reporting service if an NFR requires one). Messages must not leak stack traces or internal IDs.
- **Validation failures** (Zod) at the API boundary are bugs in the contract. Surface them loudly in dev.

## 10. Accessibility (default target WCAG 2.2 AA)

- **Semantic HTML first:** `<button>` for actions, `<a href>` for navigation, headings in order, landmarks (`header`, `nav`, `main`, `footer`), real lists and tables. Use ARIA only when no native element fits; the lint rule `prefer-tag-over-role` enforces this.
- **Keyboard:** everything interactive is reachable and operable by keyboard, with a visible `:focus-visible` style. Never use a positive `tabindex`.
- **Focus management:** after a route change, move focus to the main heading (or announce the change) and update `document.title`. Dialogs trap focus, close on Escape and restore focus to the trigger. Use a vetted primitive (native `<dialog>`, Radix or React Aria), not a hand-rolled one.
- **Content:** meaningful `alt` text (`alt=""` for decorative images); text contrast ≥ 4.5:1 (3:1 for large text and UI parts); never convey meaning by colour alone; targets at least 24×24 px.
- **Motion:** honour `prefers-reduced-motion`.
- **Verification:** jsx-a11y lint, an axe scan per route in E2E, and a manual keyboard walkthrough (testing.md).

## 11. Performance

- **Code-split by route.** Use `lazy` in the route config:
  ```ts
  { index: true, lazy: async () => ({ Component: (await import('@/routes/HomePage')).default }) }
  ```
- **Measure before optimising** (React DevTools Profiler, Lighthouse).
- Virtualise long lists (more than ~100 rows) with TanStack Virtual. Paginate server-side where the data is large.
- **Images:** give explicit `width`/`height` (prevents CLS), use `loading="lazy"` below the fold, modern formats and correct sizes.
- **Dependencies:** check `vite build` output against the budget. Prefer platform APIs (`Intl`, `URL`, `structuredClone`) over libraries, and import narrowly.
- **Core Web Vitals defaults** unless the NFRs say otherwise: LCP < 2.5 s, INP < 200 ms, CLS < 0.1.

## 12. Security

- **The client bundle is public.** No secrets in source or in any `VITE_*` variable. Secrets belong on a server or BFF.
- React escapes output by default. Avoid `dangerouslySetInnerHTML`; if it's unavoidable, sanitise with DOMPurify and record why in an ADR.
- Validate user-supplied URLs before putting them in `href`/`src`; reject `javascript:` and `data:` schemes.
- **Auth tokens:** prefer `HttpOnly; Secure; SameSite` cookies set by the backend over `localStorage`. Client-side route guards are UX only; the server must enforce authorization.
- Set a CSP and security headers at the host (tech-stack.md §7).
- **Dependencies:** commit the lockfile, run `npm audit` in CI, and vet each new dependency (maintenance, size, licence) before adding it. A new runtime dependency that isn't in the design is a CR.

## 13. Styling

- Use Tailwind utilities in JSX. When a pattern repeats, extract a component, not an `@apply` class.
- Put design tokens (colours, spacing, fonts) in `@theme` in `index.css`, named after the design doc.
- Merge classes with `cn()`, which combines `clsx` and `tailwind-merge`, so callers can override:
  ```ts
  import { clsx, type ClassValue } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
  ```
- Build mobile-first with responsive prefixes. Support dark mode only if an NFR asks (`dark:` variant).

## 14. Naming & code style

| Thing | Convention | Example |
|---|---|---|
| Components, types | PascalCase | `TodoItem`, `TodoItemProps` |
| Hooks | `use` + camelCase | `useTodos` |
| Functions, variables | camelCase | `formatDueDate` |
| Booleans | `is`/`has`/`should`/`can` prefix | `isOverdue` |
| Event props / handlers | `onX` / `handleX` | `onToggle`, `handleSubmit` |
| Module constants | SCREAMING_SNAKE_CASE | `MAX_TITLE_LENGTH` |
| Files | `PascalCase.tsx` for components, `camelCase.ts` otherwise | `TodoItem.tsx`, `http.ts` |

- No magic numbers or strings; name them as constants.
- Prefer small functions with early returns over nested conditionals.
- Prettier owns formatting and the linter owns correctness, so don't debate style in review.
- Comments explain *why*, not *what*.
- Use Conventional Commits (`feat(todos): add create form (FR-002)`) and reference the IDs.

## 15. Per-module review checklist (P3)

Walk this before marking a module done in the implementation log:

- [ ] Matches the design doc: names, schemas, contracts, component boundaries. Any difference is logged or has a CR.
- [ ] No `any`, `@ts-ignore` or unexplained `!`. External data is parsed by Zod.
- [ ] Each component and hook has a single responsibility and is under ~150 lines.
- [ ] No effect that could have been a derivation or an event handler. Effects clean up after themselves.
- [ ] State lives in the right place (§6). No server data copied into `useState`.
- [ ] Loading, error, empty and success states are all present.
- [ ] Semantic elements, labelled controls, keyboard operable.
- [ ] Unit/component tests exist, are titled with AC IDs, and query by role or label.
- [ ] `npm run check` passes.
