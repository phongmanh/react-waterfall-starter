# Waterfall process (always applies)

- All feature work in this repo goes through the `react-waterfall` skill. `docs/waterfall/STATUS.md` is the source of truth for the current phase. Read it before doing anything else.
- Phases run strictly in order: Requirements → Design → Implementation → Testing → Deployment → Maintenance. Never start a phase before the previous one is approved.
- Record an approval only when the user has explicitly approved, in their own words ("approve", "LGTM", "go ahead"). Log those words in the sign-off table. Never infer approval from silence, feedback or an unrelated reply.
- Approved documents are baselined. Changing behaviour, scope, design, data model, contracts or the stack requires a change request (`CR-###` in STATUS.md) that the user approves first. The `/change-request` command starts one.
- IDs are permanent: `FR-###`, `NFR-###`, `AC-###.#`, `ADR-###`, `DEF-###`, `CR-###`. Test titles start with the ID they verify.
- Hooks enforce the gates: no app code before Design is approved, no CI or deploy config before Testing is approved, and nothing that would wipe `docs/waterfall/`. If a hook blocks you, the block is the process working. Finish the phase or ask the user. Never edit STATUS.md, the hooks or the settings to get around a gate. Only the user may set `WATERFALL_GATE=off`.
- Before presenting a phase gate, run the `phase-reviewer` agent on the deliverable and fix its blocking findings.
- Never fabricate results. Test output, coverage, Lighthouse scores and deploy status must come from commands that actually ran.
