# Phase 5: Deployment
**Gate:** Deployed
**Deliverable:** `docs/waterfall/05-deployment.md` from [the template](../assets/templates/05-deployment.md), CI workflow, hosting config, `CHANGELOG.md`
**Load:** [tech-stack](../references/tech-stack.md) §6–§7; the hosting and environment NFRs from `01-requirements.md` by `grep`

## Entry criteria
- P4 approved.

## Activities
1. Confirm the hosting target if the requirements didn't fix it: Vercel, Netlify, GitHub Pages / any static host, or Docker + nginx.
2. Add CI (GitHub Actions by default; workflow in tech-stack.md): install → typecheck → lint → format check → unit tests with coverage → build → E2E.
3. Add the hosting config: SPA fallback to `index.html`, long-cache headers for hashed assets, and security headers including a CSP.
4. Document every environment variable. Anything prefixed `VITE_` is compiled into the public bundle, so it must never hold a secret.
5. Set the version to `1.0.0`, start a `CHANGELOG.md`, and write the release checklist and rollback procedure.
6. **Deploying, pushing, creating remote repos and setting cloud secrets are outward-facing.** Before each one, state exactly what will run and wait for explicit confirmation. If the user prefers to do it themselves, give them the exact commands.

## Exit checklist
- [ ] CI passes (or the same steps pass locally if there's no remote yet)
- [ ] The app is deployed, or the manual deploy steps are documented
- [ ] Rollback is documented
- [ ] The user approves

## Pitfalls
- **Secrets in `VITE_` variables.** They ship in the public bundle.
- **Deploying or pushing without confirmation.**
