# Tech stack & project setup

Contents: 1. Default stack · 2. When to deviate · 3. Project setup · 4. Config files · 5. Scripts · 6. CI · 7. Hosting

Everything below was verified end to end (typecheck, lint, unit tests with coverage, build, Playwright + axe) against create-vite 9 / Vite 8 / React 19.2 / TypeScript 6 / Vitest 5 / React Router 8 in October 2026. Tools move fast. If something no longer matches a tool's current docs, follow the docs and note the change in the implementation log.

## 1. Default stack (Vite SPA)

| Concern | Choice | Why |
|---|---|---|
| Runtime | Node **LTS** (24 today), pinned in `.nvmrc` + `engines` | Vitest 5 requires Node `^22.12 \|\| ^24 \|\| >=26`. On an odd release like 25, npm quietly installs older majors. |
| Build/dev | Vite + `@vitejs/plugin-react` | Fast HMR, static output that deploys anywhere |
| UI | React 19 | Current major: `ref` as a prop, Actions, `use` |
| Language | TypeScript, strict | Whatever version the template pins (currently `~6.0`). Moving to TS 7 (native) is an ADR. |
| Routing | React Router (data mode: `createBrowserRouter`) | Route-level `lazy`, `ErrorBoundary`, loaders |
| Server state | TanStack Query | Caching, retries, invalidation, cancellation |
| Validation | Zod | One schema gives runtime validation plus the inferred TS type |
| Forms | React Hook Form + `@hookform/resolvers` (zod) | Uncontrolled inputs, schema-driven validation |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`, plus `clsx` + `tailwind-merge` | No CSS-in-JS runtime, design tokens via `@theme` |
| Error boundaries | `react-error-boundary` (non-route), React Router `ErrorBoundary` (routes) | |
| Lint | **oxlint** (the template default) with type-aware rules via `oxlint-tsgolint`, plus the react, jsx-a11y, import and vitest plugins | Fast; type-aware rules catch real bugs such as floating promises and misused spreads |
| Format | Prettier + `prettier-plugin-tailwindcss` | Sorted classes, no style debates |
| Unit/component tests | Vitest + jsdom + Testing Library (react, user-event, jest-dom) | Same transform pipeline as Vite |
| API mocking | MSW | One set of handlers for tests and, optionally, dev |
| E2E + a11y | Playwright + `@axe-core/playwright` | Real browser; automated WCAG scan |

Optional, each needs an ADR:
- **React Compiler.** Off in the template because of dev/build cost. Enable it with `react({ compiler: true })` (experimental Rust port; install `oxc-transform-react`), or via Babel with `@rolldown/plugin-babel` + `babel-plugin-react-compiler` and `reactCompilerPreset()` from `@vitejs/plugin-react`. Once it's on, stop hand-writing `useMemo`/`useCallback`.
- **shadcn/ui** (Radix primitives) when the design needs accessible dialogs, menus, comboboxes and the like.
- **Zustand** for shared client state that updates frequently.

## 2. When to deviate (record an ADR)

| Requirement | Instead of the default |
|---|---|
| SEO-critical public pages, SSR/SSG, or a server is needed to hold secrets (BFF) | Next.js App Router, or React Router framework mode |
| Type-safe routes and search params are central | TanStack Router |
| The org mandates a design system or component library | Use it instead of Tailwind/shadcn |
| No backend exists yet | Keep the SPA and serve the MSW handlers as the dev backend; the API contract in the design doc is the spec the real backend must meet |
| Team standard is ESLint | ESLint flat config + typescript-eslint `strictTypeChecked` + react-hooks + jsx-a11y |

## 3. Project setup (P3, step 1)

By P3 the project directory already contains `docs/waterfall/`. Don't scaffold directly into it, and never pass `--overwrite`: create-vite wants an empty directory and would offer to delete what's there. Scaffold into a temp folder and copy without clobbering:

```bash
# in the project root (contains docs/waterfall/)
node --version   # must be an LTS line (22.12+, 24, 26+). If not, tell the user and suggest nvm/fnm.
npm create vite@latest .scaffold -- --template react-ts --no-interactive
cp -Rn .scaffold/. .     # -n: never overwrite; exits 1 if it skipped a file, which is fine
rm -rf .scaffold
rm -rf src/assets src/App.css src/App.tsx   # demo content; the design's structure replaces it
echo "24" > .nvmrc
npm install
```

For a brand-new empty directory, `npm create vite@latest <name> -- --template react-ts --no-interactive` works directly.

Install the stack in two commands. Keep `vitest` and `@vitest/coverage-v8` in the same command so their versions match:

```bash
npm install react-router @tanstack/react-query zod react-hook-form @hookform/resolvers \
  clsx tailwind-merge react-error-boundary

npm install -D tailwindcss @tailwindcss/vite oxlint-tsgolint \
  vitest @vitest/coverage-v8 jsdom \
  @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom \
  msw @playwright/test @axe-core/playwright \
  prettier prettier-plugin-tailwindcss

npx playwright install chromium     # CI uses: npx playwright install --with-deps chromium
npm ls vitest @vitest/coverage-v8   # versions must match
```

Then write the config files below, create the folder skeleton from best-practices.md §3, and run `npm run check` once before the first feature module. A green baseline proves the tooling works.

## 4. Config files

### `tsconfig.app.json` (edit the generated file; keep its other options)
Add these to `compilerOptions`. `strict` is already the TS 6 default, but stating it explicitly protects against version changes.
```jsonc
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "paths": { "@/*": ["./src/*"] },   // mirrored by resolve.tsconfigPaths in vite.config.ts
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true
```

### `tsconfig.node.json`
Add `"strict": true`, and extend `include` so the Playwright config and E2E tests are typechecked:
```jsonc
  "include": ["vite.config.ts", "playwright.config.ts", "e2e"]
```
This config uses `module: nodenext`, so import CommonJS packages by named export, e.g. `import { AxeBuilder } from '@axe-core/playwright'`. A default import fails to typecheck here.

### `vite.config.ts`
```ts
/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // Unit coverage targets logic; the app shell and routes are covered by E2E.
      include: ['src/features/**/*.{ts,tsx}', 'src/lib/**/*.{ts,tsx}'],
      exclude: ['**/*.test.{ts,tsx}', '**/index.ts'],
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
    },
  },
})
```

### `src/index.css`
```css
@import 'tailwindcss';

@theme {
  /* design tokens from 02-design.md, e.g. --color-brand-600: oklch(0.55 0.2 260); */
}
```

### `src/vite-env.d.ts`: type every env var the design lists
```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### `.oxlintrc.json`
```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc", "jsx-a11y", "import", "vitest"],
  "options": { "typeAware": true },
  "categories": { "correctness": "error", "suspicious": "warn" },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/exhaustive-deps": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }],
    "react/react-in-jsx-scope": "off",
    "typescript/no-explicit-any": "error",
    "typescript/no-non-null-assertion": "warn",
    "typescript/no-floating-promises": "error",
    "typescript/no-misused-promises": "error",
    "typescript/consistent-type-imports": "error",
    "import/no-cycle": "error",
    "import/no-unassigned-import": ["warn", { "allow": ["**/*.css", "@testing-library/jest-dom/vitest"] }],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  },
  "ignorePatterns": ["dist", "coverage", "playwright-report", "test-results"]
}
```
The `react-in-jsx-scope` rule is off because the automatic JSX runtime doesn't need React in scope. The `jsx-a11y` plugin enforces `prefer-tag-over-role`: use `<output>` for a status message rather than `<p role="status">`.

### `.prettierrc.json` and `.prettierignore`
```json
{ "semi": false, "singleQuote": true, "trailingComma": "all", "plugins": ["prettier-plugin-tailwindcss"] }
```
```
dist
coverage
playwright-report
test-results
package-lock.json
```
If the project already has a formatting convention, keep it instead. Run `npm run format` once after scaffolding so the generated files conform.

### `.gitignore` additions
```
coverage
playwright-report
test-results
.env*.local
```

### `playwright.config.ts`
```ts
import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Test the production build, not the dev server.
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env['CI'],
  },
})
```
Add more `projects` (firefox, webkit, mobile viewports) when the browser-support NFR requires them.

## 5. Scripts (`package.json`)

```json
"engines": { "node": ">=22.12" },
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "typecheck": "tsc -b",
  "lint": "oxlint",
  "lint:fix": "oxlint --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "check": "npm run typecheck && npm run lint && npm run format:check && npm run test:run"
}
```
`npm run check` is the per-module gate in P3. oxlint prints nothing when the code is clean; a zero exit code is the pass signal.

## 6. CI: `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run format:check
      - run: npm run test:coverage
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v7
        if: failure()
        with: { name: playwright-report, path: playwright-report }
```
Check the current major versions of the `actions/*` steps when writing the file. Add `npm audit --audit-level=high` if the security NFR calls for it.

## 7. Hosting notes

Every host needs three things: an SPA fallback (unknown paths serve `index.html`), immutable caching for `/assets/*` (filenames are content-hashed), and security headers.

- **Vercel:** zero config for Vite. Add `vercel.json` with `"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]` and a `headers` block.
- **Netlify:** `public/_redirects` containing `/*  /index.html  200`, plus `public/_headers`.
- **GitHub Pages:** set `base: '/<repo>/'` in the Vite config, and copy `index.html` to `404.html` during the build to get SPA fallback.
- **Docker + nginx:** multi-stage build (`node:24-alpine` builds, `nginx:alpine` serves `dist/`) with `try_files $uri /index.html;`.

Baseline security headers: `Content-Security-Policy` (start from `default-src 'self'` and add only the origins the design lists), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `frame-ancestors 'none'` in the CSP unless embedding is required.
