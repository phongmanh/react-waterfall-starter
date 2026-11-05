# Design style: the default house style

A ready-made visual language for apps built with this skill: colour tokens, type, spacing, component recipes and page shells. It comes from two production apps built with this skill, so every recipe has shipped and passed axe. Use it in P2 (`02-design.md` §10 "Visual design"), build it in P3 (tokens in module 1, then the shared-UI module), and check it in P4 ([ui-ux.md](ui-ux.md) §7).

A project with its own brand or design system keeps this file's **structure** (token names, component recipes, rules) and swaps the **values** in §2–§3. Record that as an ADR. Changing the style of an app whose design is already approved is a CR (§9).

## 1. Principles

1. **Calm, dense, legible.** Built for work tools that people use for hours on phones, tablets and laptops. Neutral grounds, one green accent, no decoration that doesn't carry meaning.
2. **One primary action per view.** It's the filled primary button. Everything else is secondary, ghost or a link.
3. **Status is text first.** Every badge, chip and notice says its state in words. Colour only reinforces it.
4. **Ready for translation.** Translated text often runs 30–40 % longer than English. Never size widths to English copy; let labels wrap.
5. **Two themes, one system.** The **light shell** (warm neutrals, white sidebar) suits the everyday app. The **dark shell** (cool neutrals, navy sidebar) suits back-office and admin apps, so users can tell them apart at a glance when a product has both.

## 2. Colour tokens

Define them in `src/index.css` inside `@theme`, so Tailwind generates `bg-*`, `text-*` and `border-*` utilities from them. Use only the token names; never write a hex value in JSX.

### 2.1 Shared tokens (same in both themes)

| Token | Value | Use | Contrast |
|---|---|---|---|
| `--font-sans` | `system-ui, sans-serif` (or a self-hosted brand font, §3) | all text | — |
| `--color-surface` | `#FFFFFF` | cards, panels, tables, inputs, dialogs | — |
| `--color-ink` | `#16201B` | body text | 15.3:1 on light ground, 15.1:1 on dark-shell ground |
| `--color-primary` | `#1D6B48` | primary buttons, links, selected state, focus ring | 6.5:1 with white, 5.8:1 on ground |
| `--color-primary-hover` | `#14503A` | primary hover; success badge text | 8.0:1 on `success-bg` |
| `--color-primary-ink` | `#FFFFFF` | text on primary | 6.5:1 |
| `--color-success-bg` | `#E3F0E8` | success badge and notice background | — |
| `--color-danger` | `#A3271B` | destructive buttons | 7.3:1 with white |
| `--color-danger-ink` | `#8A1F14` | error text, danger badge text | 8.1:1 on `danger-bg` |
| `--color-danger-bg` | `#FBEDEB` | error alert, danger badge background | — |
| `--color-info` | `#1F4FA8` | info badge text, info notice border | 6.4:1 on `info-bg` |
| `--color-info-bg` | `#E3ECFB` | info badge and notice background | — |
| `--color-accent` | `#E0A526` | "needs attention now" markers, as a **background with `ink` text** only | 7.6:1 with ink; 2.2:1 on white, so never as text |
| `--spacing-control` | `2.75rem` | control height (44 px) | — |

### 2.2 Theme tokens

| Token | Light shell | Dark shell | Use |
|---|---|---|---|
| `--color-ground` | `#F4F5F2` | `#F2F3F6` | page background |
| `--color-subtle` | `#ECEEEA` | `#ECEEF2` | table header, chips, neutral badge (ink on it 14.3:1 / 14.4:1) |
| `--color-ink-2` | `#3E4A44` | `#3E4450` | secondary text in tables (9.3:1 / 9.8:1 on white) |
| `--color-muted` | `#56615B` | `#5B6170` | hints, captions (5.9:1 / 5.6:1 on ground) |
| `--color-line` | `#D9DED8` | `#C9CFD8` | dividers, card and table borders (decorative only) |
| `--color-line-strong` | `#7B847F` | `#7D8590` | form-control borders (3.9:1 / 3.7:1 on white, 3.5:1 / 3.4:1 on ground) |
| `--color-nav` | — (the shell is `surface`) | `#1B2233` | sidebar and mobile header |
| `--color-nav-hover` | — | `#2D3650` | sidebar hover and current item |
| `--color-nav-ink` | — | `#D3D8E3` | sidebar text (11.1:1), focus ring on nav |
| `--color-nav-muted` | — | `#B8BFCF` | sidebar secondary text (8.6:1) |

**Why `line-strong`:** WCAG 1.4.11 asks for 3:1 on the boundary that identifies a form control. A light `line` border (1.4–1.6:1) passes axe but fails 1.4.11, so inputs, selects, checkboxes and radios use `line-strong`. `line` is only for borders that don't identify a control. Before you baseline a new or changed pair, check it with the script in §8.

### 2.3 Status → tone

| Typical statuses | Tone | Badge recipe |
|---|---|---|
| Active, Available, Paid, Done | success | `border-primary/30 bg-success-bg text-primary-hover` |
| Invited, Pending, New | info | `border-info/30 bg-info-bg text-info` |
| Suspended, Failed, Cancelled, Out of stock | danger | `border-danger/30 bg-danger-bg text-danger-ink` |
| Inactive, Hidden, Closed, unknown ("Other") | neutral | `border-line bg-subtle text-ink` |
| Needs attention now | accent | `border-accent bg-accent/25 text-ink` |

## 3. Typography, spacing, shape

- **Font:** the system stack by default, so there's nothing to load. For a brand font, self-host it with Fontsource (only the subsets and weights the copy needs, `font-display: swap`), which keeps the CSP at `font-src 'self'`. Record the choice as an ADR.
- **Scale** (Tailwind defaults, rem-based so user zoom works):

  | Role | Class | Weight |
  |---|---|---|
  | Page title (`h1`, one per page) | `text-2xl` | `font-semibold` |
  | Section or dialog title (`h2`) | `text-lg` | `font-semibold` |
  | Body, table cells, inputs | `text-base` | 400 |
  | Labels, buttons | `text-base` | `font-medium` |
  | Hints, captions, badges, table meta | `text-sm` | 400 (badges `font-medium`) |
  | Numbers, money, times | add `tabular-nums` | — |

- **Spacing:** a 4 px grid (Tailwind units). Page padding `p-4`, `lg:p-6`. Card and dialog padding `p-4` to `p-6`. Gap between form fields `gap-4`, between sections `gap-8`. Page header bottom `pb-4`.
- **Radius:** controls, alerts and nav items use `rounded-lg`. Cards, panels and empty states use `rounded-xl`. Badges and chips use `rounded-full`.
- **Elevation:** borders, not shadows. Dialogs use the native `::backdrop` (`bg-ink/40`); nothing else casts a shadow.
- **Widths:** forms `max-w-2xl` to `max-w-3xl`. Public pages are a centred `max-w-md` card. Tables are full width and scroll horizontally inside their own wrapper, never the page.
- **Breakpoints:** mobile-first. At `lg` (1024 px) a fixed 16 rem sidebar appears; below it, a header with a menu button opens the nav in a drawer `Dialog`. At `xl` (1280 px) a list can show a detail side panel. Verify at 360, 768, 1024 and 1440 px.

## 4. Focus, motion, targets

- **Focus ring** on `:focus-visible`: `3px solid var(--color-primary)` with `outline-offset: 2px`. On a navy surface, use `focus-visible:outline-nav-ink`, because primary on navy is only 2.5:1. Time inputs also get the ring on `:focus-within`, since WebKit never matches `:focus-visible` there.
- **Targets:** every interactive control is at least 44 × 44 px (`min-h-11 min-w-11`), including icon buttons, chip remove buttons and table-row actions.
- **Motion:** none beyond colour transitions. Under `prefers-reduced-motion`, all animation and transition durations drop to 0.01 ms.

## 5. Component recipes

These are the `src/components/ui` primitives, built on native elements with no UI kit. Keep the class recipes below.

| Component | Recipe | Behaviour |
|---|---|---|
| `Button` | base `inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border px-4 font-medium disabled:cursor-not-allowed disabled:opacity-55`; variants `primary` (`bg-primary text-primary-ink hover:bg-primary-hover border-transparent`), `secondary` (`bg-surface text-ink border-line hover:bg-subtle`), `danger` (`bg-danger text-white hover:bg-danger-ink border-transparent`), `ghost` (`bg-transparent text-ink border-transparent hover:bg-ink/5`) | `type="button"` by default; `isPending` disables it and sets `aria-busy` |
| `LinkButton` | the `Button` classes on a router `Link` | navigation stays a link |
| Text field, select, textarea | `min-h-11 w-full rounded-lg border border-line-strong bg-surface px-3 text-ink aria-invalid:border-danger`; textarea adds `min-h-20 py-2`; select adds `appearance-none pr-9` and a chevron | visible label (`font-medium`) above; hint `text-sm text-muted`; error `text-sm font-medium text-danger-ink`; both in `aria-describedby` |
| `Alert` | `rounded-lg border p-3 text-ink`; `error` `border-danger/40 bg-danger-bg`; `warning` `border-line border-l-4 border-l-danger-ink bg-surface`; `info` `border-info/30 bg-info-bg` | `error` and `warning` use `role="alert"`, `info` uses `role="status"` |
| `Badge` | `inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-medium whitespace-nowrap` plus a tone from §2.3 | always has text |
| `PageHeader` | `flex flex-wrap items-center justify-between gap-3 pb-4`; `h1` `text-2xl font-semibold` with `tabIndex={-1}` | primary action on the right; wraps under the title on mobile |
| `Dialog` | native `<dialog>` opened with `showModal()`; header `border-b border-line p-4` (`h2 text-lg`) plus a close button; body `overflow-y-auto p-4`; footer `flex flex-wrap justify-end gap-2 border-t border-line p-4` | Escape closes it; focus returns to the trigger |
| `ConfirmDialog` | a `Dialog` with body text and two buttons; a destructive confirm uses `danger` | focuses the least destructive button |
| Table | `<table class="w-full border-collapse">` in an `overflow-x-auto rounded-xl border border-line bg-surface` wrapper; `thead` `bg-subtle`; `th` `px-3 py-2 text-left text-sm font-semibold text-ink-2`; `td` `px-3 py-3 align-top`; rows `border-t border-line hover:bg-subtle/60`, selected `bg-success-bg/60` | `th scope`; each row's name is a link; "Load more" moves focus to the first new row |
| `EmptyState` | `flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface p-8 text-center`, with an `h2 text-lg`, `text-muted` copy and an optional action | — |
| `ErrorPanel` | `m-4 flex flex-col items-start gap-3 rounded-xl border border-danger/40 bg-surface p-6` plus Retry | lives inside the route's error boundary |
| `FactList` | `<dl>` grid `gap-x-6 gap-y-3 sm:grid-cols-[minmax(8rem,auto)_1fr]`; `dt` `text-sm font-medium text-muted` | — |
| `FilterChip` | `inline-flex items-center gap-1 rounded-full border border-line bg-subtle py-0.5 pl-3` plus a 44 px remove button | removing it drops the filter from the URL |
| Loading | `<output>` with text, or skeleton rows at the final size (no layout shift) | never a bare spinner |
| Nav item | `flex min-h-11 items-center rounded-lg border-l-4 border-transparent px-3`; current item: light shell `border-primary bg-primary/10 font-semibold`, dark shell `border-nav-ink bg-nav-hover text-white font-semibold` | `aria-current="page"` |

## 6. Layout shells

```
Light shell                              Dark shell
┌───────────┬──────────────────────┐     ┌───────────┬──────────────────────┐
│ surface   │ ground               │     │ nav       │ ground               │
│ border-r  │ main p-4 lg:p-6      │     │ (#1B2233) │ main p-4 lg:p-6      │
│ app name, │  PageHeader          │     │ app name, │  PageHeader          │
│ user      │  content             │     │ user      │  content │ side panel│
│ nav list  │                      │     │ nav list  │          │ (≥1280px) │
└───────────┴──────────────────────┘     └───────────┴──────────────────────┘
 < 1024 px: top header (surface / nav) + menu button → drawer Dialog
```

Both shells have:
- a skip link ("Skip to content") as the first focusable element;
- a `RouteFocus` component that moves focus to the `h1` and sets `document.title` after navigation;
- app-wide notices (offline, new version) above `main` with `role="status"`.

Public pages (sign-in, invitation, password reset) use a centred `max-w-md` column, with the brand and a language switch in the header. Their content sits in a `rounded-xl border border-line bg-surface p-6` card.

## 7. Content and microcopy

- Use sentence case everywhere ("Create a project", not "Create A Project").
- Buttons name the verb and the object ("Delete project", "Copy link"), never "OK" or "Submit".
- Errors say what happened and what to do, in the user's terms. For unknown failures: "Something went wrong. Try again.", plus the request ID with a Copy button when there is one.
- Destructive confirmations name the object and the effect, and the confirm button repeats the verb.
- Secrets that are shown once (invitation links, recovery codes) get a read-only field, a Copy button, and a "Shown once" note with the expiry.
- Every string goes through the i18n catalogue in every supported language, and a unit test checks that the catalogues have the same keys.

## 8. Tokens file and checks

`src/index.css` (dark-shell values shown; swap in the §2.2 values for the light shell and drop the `nav` tokens):

```css
@import 'tailwindcss';

/* Design tokens: 02-design.md §10 "Visual design" (references/design-style.md). */
@theme {
  --font-sans: system-ui, sans-serif;
  --color-ground: #f2f3f6;
  --color-surface: #ffffff;
  --color-subtle: #eceef2;
  --color-ink: #16201b;
  --color-ink-2: #3e4450;
  --color-muted: #5b6170;
  --color-line: #c9cfd8;
  --color-line-strong: #7d8590;
  --color-nav: #1b2233;
  --color-nav-hover: #2d3650;
  --color-nav-ink: #d3d8e3;
  --color-nav-muted: #b8bfcf;
  --color-primary: #1d6b48;
  --color-primary-hover: #14503a;
  --color-primary-ink: #ffffff;
  --color-success-bg: #e3f0e8;
  --color-danger: #a3271b;
  --color-danger-ink: #8a1f14;
  --color-danger-bg: #fbedeb;
  --color-info: #1f4fa8;
  --color-info-bg: #e3ecfb;
  --color-accent: #e0a526;
  --spacing-control: 2.75rem;
}

@layer base {
  html {
    background-color: var(--color-ground);
    color: var(--color-ink);
    font-family: var(--font-sans);
  }
  :focus-visible,
  input[type='time']:focus-within {
    outline: 3px solid var(--color-primary);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

**Check contrast before you baseline new values.** The script uses the WCAG 2.x formula; targets are 4.5:1 for text and 3:1 for large text and UI parts. Pass `foreground:background` pairs:

```js
// node contrast.mjs '#5B6170:#F2F3F6' '#7D8590:#FFFFFF'
const L = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] }
for (const [a, b] of process.argv.slice(2).map((p) => p.split(':'))) {
  const [x, y] = [L(a), L(b)]
  console.log(a, b, ((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2))
}
```

## 9. Adopting the style in an app that's already designed

The style is part of the approved design (§10 and the visible UI), so changing it is a CR:
1. **Diff the tokens.** Compare the app's `@theme` with §2 and list the tokens it's missing, the ones whose values differ, and its own extra tokens, which it keeps.
2. **Diff the primitives.** Compare each `components/ui` primitive with §5: button hovers, badge tones, field borders (`line-strong`), alert tones and nav item.
3. **Log one CR** ("design style alignment") with that list as its impact. Note any value that changes contrast, with the before and after ratios from the §8 script.
4. **After approval,** update `02-design.md` §10, then `index.css`, then the primitives and their tests. Rerun the axe E2E suite and the four-viewport check, and attach screenshots to the CR.
