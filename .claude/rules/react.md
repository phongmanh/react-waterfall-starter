---
paths:
  - "src/**/*.tsx"
---

# React rules

Full standard: `.claude/skills/react-waterfall/references/best-practices.md` §4–§11. The non-negotiables:

- Function components with a named `XProps` type, destructured in the signature. No `React.FC`, and never define a component inside another component.
- Logic lives in custom hooks and components render. Split anything over ~150 lines by responsibility.
- Effects only synchronise with external systems. Derive values during render, handle events in handlers, fetch with TanStack Query, and clean up every subscription.
- State placement: server state goes in TanStack Query (never copied into `useState`), URL state in search params, form state in React Hook Form + Zod, and local UI state in `useState`. Use Context or Zustand only for truly shared client state.
- Every async view renders loading (`<output>`), error (`role="alert"` + Retry), empty, and success states.
- Accessibility (WCAG 2.2 AA):
  - Use semantic elements first.
  - Every control has a label.
  - Non-submit buttons get `type="button"`.
  - Focus is visible and the UI works by keyboard.
  - Use a vetted primitive for dialogs.
- Keys come from stable data IDs, never from array indexes for dynamic lists. Conditional rendering uses `count > 0 && …`, never `count && …`.
- Security: no `dangerouslySetInnerHTML` without DOMPurify and an ADR, and no user-supplied `javascript:`/`data:` URLs in `href`/`src`.
