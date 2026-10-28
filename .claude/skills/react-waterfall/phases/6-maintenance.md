# Phase 6: Maintenance & handover
**Gate:** Project closed
**Deliverable:** `docs/waterfall/06-maintenance.md` from [the template](../assets/templates/06-maintenance.md), project `README.md`
**Load:** nothing beyond this file; read the runbook facts from `05-deployment.md` by section

## Entry criteria
- P5 approved.

## Activities
1. Write the project `README.md`: what the app is, prerequisites (Node version), setup, scripts, folder structure, and a link to `docs/waterfall/`.
2. Fill in the maintenance doc:
   - runbook: run, build, deploy, roll back
   - known issues and limitations
   - accepted defects
   - dependency update policy
   - monitoring
   - change process: small changes are a CR against the baselined docs; a major version starts a new waterfall cycle
3. Mark every phase final and the project `Closed — v1.0.0` in STATUS.md, then ask for the closing sign-off.

**After closure,** any new request on this project ("add dark mode") is a CR or a new cycle. Re-enter at Phase 1 with that change; don't edit the code directly.

## Exit checklist
- [ ] README and maintenance doc are complete
- [ ] Every phase is marked final and the project `Closed — v1.0.0` in STATUS.md
- [ ] The user gives the closing sign-off
