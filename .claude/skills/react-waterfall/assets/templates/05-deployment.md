# Deployment — <Project name>

| Version | Date | Status |
|---|---|---|
| 1.0 | <YYYY-MM-DD> | Draft |

## 1. Target
- **Host:** <Vercel / Netlify / GitHub Pages / Docker + nginx / other>
- **Environments:** <production; preview per PR?>
- **URL(s):** <…>

## 2. Build
- Command: `npm run build` → `dist/`
- Node: per `.nvmrc`
- SPA fallback: <how configured>
- Asset caching: `/assets/*` immutable, `index.html` no-cache

## 3. Environment variables

| Name | Purpose | Public (`VITE_`)? | Where set |
|---|---|---|---|
| `VITE_API_BASE_URL` | API origin | Yes — compiled into bundle | host settings |

<!-- Anything VITE_* is public. Secrets never go here. -->

## 4. Security headers
<!-- Exact header values as configured. -->
- Content-Security-Policy:
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy:

## 5. CI/CD
- Workflow: `.github/workflows/ci.yml` — typecheck → lint → format → unit+coverage → E2E
- Deploy trigger: <manual / on merge to main / host's Git integration>
- Last run: <link or local result>

## 6. Release checklist
- [ ] P4 approved; RTM all Must = Pass
- [ ] Version bumped to <x.y.z>; CHANGELOG.md updated
- [ ] Env vars set in target environment
- [ ] CI green on release commit
- [ ] Deployed (confirmed with user before running)
- [ ] Smoke test on production URL: <flows>
- [ ] Security headers verified on production URL

## 7. Rollback
<!-- Exact steps: host's "promote previous deployment", redeploy previous tag, or docker image tag. -->
