---
paths:
  - "src/**/*.{ts,tsx}"
  - "e2e/**/*.ts"
---

# TypeScript rules

Full standard: `.claude/skills/react-waterfall/references/best-practices.md` §2. The non-negotiables:

- No `any`, `@ts-ignore` or `@ts-expect-error` without a written reason. Every exception goes in the implementation log.
- External data (HTTP, storage, URL params, `postMessage`) is `unknown` until a Zod schema parses it. Types come from schemas: `type X = z.infer<typeof XSchema>`.
- Model UI and async states as discriminated unions, and check them exhaustively with `never`.
- No `enum` or `namespace` (`erasableSyntaxOnly`). Use literal unions or `as const` objects instead.
- `import type` for type-only imports. Use the `@/` alias across folders and relative imports within a feature.
- Avoid `!`. Guard instead, and throw with a message.
- Exported functions and hooks that form a module's public API get explicit return types.
- Code must match the approved design: schema fields, route paths, API contracts and module boundaries. A difference needs a CR, not a quiet fix.
