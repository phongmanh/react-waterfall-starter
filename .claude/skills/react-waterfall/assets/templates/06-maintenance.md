# Maintenance & Handover — <Project name>

| Version | Date | Release | Status |
|---|---|---|---|
| 1.0 | <YYYY-MM-DD> | v1.0.0 | Draft |

## 1. Runbook

| Task | How |
|---|---|
| Run locally | `nvm use && npm ci && npm run dev` |
| Verify | `npm run check && npm run test:e2e` |
| Build | `npm run build` |
| Deploy | <see 05-deployment.md §5> |
| Roll back | <see 05-deployment.md §7> |

## 2. Known issues & limitations

| Item | Impact | Workaround | Tracking |
|---|---|---|---|
| | | | |

## 3. Accepted defects
<!-- Open defects the user accepted at the P4 gate. -->

## 4. Dependency & security updates
- Cadence: <e.g. monthly `npm outdated` + `npm audit`; Dependabot/Renovate for patches>
- Major upgrades: each is a CR with an ADR; run full P4 verification after.
- Node: move `.nvmrc` to the next LTS when the current one leaves Active LTS.

## 5. Monitoring
<!-- Error reporting, analytics, uptime — or "None (out of scope per 01-requirements §9)". -->

## 6. Change process
- **Small change / bug:** log CR-### in STATUS.md → update affected docs → implement → test → RTM → release.
- **Major version / new scope:** start a new waterfall cycle at P1, referencing these baselined docs.

## 7. Handover
- Docs index: `docs/waterfall/STATUS.md`
- Contacts / owners: <…>
