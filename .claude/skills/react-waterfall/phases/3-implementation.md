# Phase 3: Implementation
**Gate:** Code complete
**Deliverable:** the app, and `docs/waterfall/03-implementation-log.md` from [the template](../assets/templates/03-implementation-log.md)
**Load:**
- Setup: [tech-stack](../references/tech-stack.md) §3–§5.
- Per module: [best-practices](../references/best-practices.md) §15 (per-module checklist), [testing](../references/testing.md) §2–§3.
- From the approved docs, by section only (see below).

## Entry criteria
- P2 approved.

## Scope each session
`02-design.md` is the spec, but don't re-read whole documents every session.
- List the design's headings (`grep -n '^##' docs/waterfall/02-design.md`), then read the build order and the sections the current module cites.
- Pull that module's FRs and ACs from `01-requirements.md` with `grep`.
- Read only the last rows of the implementation log.
- Read code as the SKILL's [Reading on demand](../SKILL.md#reading-on-demand) rules say: `index.ts` and `grep -n '^export'` to get oriented, and open in full only the files you'll change.
- Build one module per session: commit at the boundary, then stop so the user can `/clear` before the next one.

## Activities
1. **Scaffold and configure** per `references/tech-stack.md` → "Project setup". It covers scaffolding safely next to the existing `docs/`, installing the stack, the strict tsconfig, lint, format, test config, scripts and Node version. Record the resolved major versions in the log.
2. **Version control.** If the project isn't a git repo, offer to `git init`. Suggest a commit at each module boundary (Conventional Commits). Commit only once the user agrees; that agreement can cover the whole project, so note it in STATUS.md.
3. **Build modules in the design's order.** For each module:
   - Implement it exactly as designed, following best-practices.md.
   - Write its unit/component tests alongside it, with titles carrying AC IDs.
   - Run `npm run check` (typecheck + lint + format check + unit tests). Fix failures before starting the next module; never stack new code on a red build.
   - Walk the review checklist at the end of best-practices.md.
   - Append a row to the implementation log: module, FRs, files, tests, notes and deviations.
4. **Deviations.** You may decide internal details the design left open, such as helper names, private sub-components or local variables, and log them. Anything visible in the design doc (routes, schemas, contracts, component boundaries, libraries) needs a CR.
5. **Finish** with `npm run build` succeeding and the app working under `npm run dev`. Offer to start the dev server so the user can click through before signing off.

## Exit checklist
- [ ] Every build-order module is done
- [ ] `npm run check` and `npm run build` pass
- [ ] Every FR lists its implementing files in the log
- [ ] The user approves

## Pitfalls
- **Coding around a wrong design.** Raise a CR instead.
- **Stacking new code on a red build.**
- **Orientation sweeps** that `cat` whole feature folders, or read a saved oversized output with `allow_large`. They fill the context before any work starts.
