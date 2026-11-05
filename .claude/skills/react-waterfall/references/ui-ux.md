# UI/UX in the waterfall

How user experience is decided, written down, built and verified across the six phases. The visual language (tokens, components, shells) is in [design-style.md](design-style.md); this file is the process and the patterns. The rule is the same as for code: UX decisions are made once, in writing, before P3, and every screen traces to the FRs it serves.

| Phase | UX work | Where it lands |
|---|---|---|
| P1 | Users, tasks, devices, inputs (design boards, sibling apps), UX NFRs | `01-requirements.md` §2, §5, constraints |
| P2 | Screen inventory, flows, screen specs, UX states, responsive rules, visual design, microcopy | `02-design.md` §4, §5, §9, §10 |
| P3 | Build to the spec; per-screen UX checklist (§6) | code, implementation log |
| P4 | UX verification (§7) | `04-test-report.md` |

## 1. P1: what the UX must achieve

Add these to the P1 interview (AskUserQuestion, with defaults):
- **Who and where.** Each role's main tasks, how often, and on what device: e.g. field staff on a phone, a shared wall tablet, back-office users on a laptop. This sets the breakpoints and the target sizes.
- **Inputs.** Existing design boards, a sibling app to match, or a brand. Save copies in `docs/waterfall/inputs/` with their source and version, so later sessions don't re-fetch them. With no brand or sibling app, the default is [design-style.md](design-style.md) with the theme that fits the users (light shell or dark shell).
- **UX NFRs, measurable.** Defaults to offer: WCAG 2.2 AA (axe: zero violations on every route, plus a keyboard-only pass of the core flows); targets ≥ 44 × 44 px; usable from 360 px wide with no horizontal page scroll; languages and the default one; "a first-time user completes <core task> without help" checked in the P4 walkthrough.
- **Content.** Languages, tone, who writes the copy, and any wording the AC must fix exactly.

Write the AC in user-visible terms (what appears, what's announced, where focus goes), so P2 and P4 can trace them.

## 2. P2: screen inventory and flows

1. **Screen inventory.** The route table (`02-design.md` §4) is the inventory: one row per screen with its FRs, auth, and layout (`public`, `shell`, `shell + side panel`, `dialog`). Every FR appears on at least one screen.
2. **Flows.** For each core task, a short numbered flow: entry point → screens and dialogs → success state → where the user lands. Mark branches for errors and permissions. Put them under `02-design.md` §5 or a `### Flows` heading so P4 can turn each into an E2E test.
3. **Navigation.** The nav items per role, their order, and the current-item rule. Deep links (every list filter and detail view has a URL) and what Back does.

## 3. P2: screen specs

For every screen in the inventory, `02-design.md` §5 gives the component tree (as today) plus a short spec:

| Field | Content |
|---|---|
| Purpose | One sentence: the task it serves (FR IDs) |
| Primary action | The one filled primary button, or "none (read only)" |
| Layout | Shell, max width, columns per breakpoint, what moves or collapses below `lg` |
| Content order | Header → notices → filters → content → secondary actions, top to bottom |
| States | Loading, empty, error, success, and permission-limited (the §9 row) |
| Focus | Where focus goes on arrival, after submit, after an error, after a dialog closes |
| Copy | The fixed strings the AC require, by i18n key |

When design boards exist, cite the board per screen and record every intentional difference from it.

## 4. Patterns

Use these unless a requirement says otherwise. Each has a primitive in design-style.md §5.

| Situation | Pattern |
|---|---|
| Lists of records | Table with a name link per row, filters above it bound to the URL, "Load more" (cursor paging) that moves focus to the first new row, an empty state that says why and offers the next action |
| List + detail | Detail as a nested route: side panel at ≥ 1280 px, its own page below (one URL, two layouts) |
| Create and edit | Full page for long forms, `Dialog` for ≤ 4 fields. React Hook Form + Zod, errors on blur and submit, focus the first invalid field. Unsaved-changes guard on long forms |
| Destructive actions | `ConfirmDialog` that names the object and the effect; confirm button repeats the verb; focus starts on Cancel. Irreversible ones (erase) require typing a word |
| Writes | Button pending + disabled while in flight; success announced in the polite live region; stale data (`412`) shows a notice and keeps the input; rate limits show a countdown button |
| Secrets shown once | Read-only field + Copy (fallback: select the text and announce it) + "Shown once" and expiry |
| Status | Badge with text (design-style.md §2.3); unknown values read "Other" with no actions |
| Background state | App-wide notices above `main` (`role="status"`): offline, new version available, account or workspace restrictions |
| Loading | `<output>` text or skeletons at the final size; nothing shifts when data arrives |
| Errors | Field errors next to the field; request errors in an `Alert` with Retry; route crashes in that route's error boundary so the shell keeps working |

## 5. P2: visual design and responsive rules

In `02-design.md` §10, add a `### Visual design` subsection:
- The style and theme used (e.g. "design-style.md, dark shell"), and the token table copied in full, since P3 copies it into `index.css`.
- Any token added or changed, with its contrast ratio from the script in design-style.md §8.
- Breakpoints and what changes at each, the shells used, and the content max widths.
- Deviations from the house style, each with an ADR.

## 6. P3: per-screen UX checklist

Walk this with best-practices.md §15 for every module that renders a screen:

- [ ] Matches its screen spec: primary action, content order, layout per breakpoint.
- [ ] Only tokens and the shared primitives; no hex values, no one-off button or field styles.
- [ ] Loading, empty, error, success and permission-limited states render, each with its spec'd copy.
- [ ] Focus lands where the spec says on arrival, after submit, after an error and after a dialog closes.
- [ ] Every control is ≥ 44 px, labelled, and reachable by Tab in visual order.
- [ ] Status never relies on colour alone.
- [ ] Copy comes from the catalogue in every language; the longest language's strings wrap without clipping at 360 px.
- [ ] Tried at 360 px and 1440 px in `npm run dev` (and in the user's browser if they want to click through).

## 7. P4: UX verification

| Check | Method | Evidence |
|---|---|---|
| Automated accessibility | axe in Playwright on every route and every open dialog, all browsers | violations per route (target 0) |
| Keyboard | Manual pass of each core flow with Tab, Shift+Tab, Enter, Space, Escape | pass/fail per flow, notes |
| Screen reader smoke | VoiceOver or NVDA on sign-in and one core flow: names, roles, announcements | pass/fail, notes |
| Responsive | Playwright at 360, 768, 1024, 1440 px: no horizontal page scroll, shell switches at `lg` | pass/fail per viewport |
| Visual consistency | Screenshots of each screen per viewport against the boards or the house style | screenshots in `test-results/`, differences logged as DEF or accepted |
| Content | Both languages on every screen: no missing keys, no clipped text | pass/fail per language |
| Task walkthrough | The user (or a stand-in) does each core task without help | completed / where they got stuck |

A UX defect is a `DEF-###` like any other. A fix that changes a screen spec, a flow or a token is a CR.
