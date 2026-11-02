# <Project name> — Waterfall status

| | |
|---|---|
| Project root | `<path>` |
| Started | <YYYY-MM-DD> |
| Current phase | P1 Requirements |
| Project status | Active <!-- Active · Closed — v1.0.0 --> |
| Gate policy | Hard sign-off per phase <!-- or: "Gates waived by user on <date>: '<their words>'" --> |
| Commit policy | Not agreed yet <!-- or: "Commit per module (agreed <date>)" --> |

## Phases

| Phase | Deliverable | Status | Approved on | Notes |
|---|---|---|---|---|
| P1 Requirements | [01-requirements.md](01-requirements.md) | In progress | | |
| P2 Design | [02-design.md](02-design.md) | Not started | | |
| P3 Implementation | code + [03-implementation-log.md](03-implementation-log.md) | Not started | | |
| P4 Testing | [04-test-report.md](04-test-report.md) | Not started | | |
| P5 Deployment | [05-deployment.md](05-deployment.md) | Not started | | |
| P6 Maintenance | [06-maintenance.md](06-maintenance.md) + README.md | Not started | | |

<!-- Status values: Not started · In progress · Awaiting approval · Approved · Approved (gate waived).
     Keep this table's columns as they are: project hooks read the Status column. Changes to an approved phase go through the change-request table, not by editing a phase's status. -->

## Sign-off log

| Date | Phase / CR | Approved by (user's words) |
|---|---|---|
| | | |

## Change requests

| ID | Date | Change & reason | Affects (docs / files / tests) | Status |
|---|---|---|---|---|
| | | | | |

<!-- Status: Proposed · Approved · Rejected · Implemented. A CR is Implemented only when every affected doc, file, test and RTM row is updated. -->

## Handoff

<!-- Rewritten at the end of every session (skill rule 6); the SessionStart hook injects it after /clear. ≤ 15 lines, 30 max.
     Facts only. Anything a later phase needs for good belongs in a phase doc, not here. -->
- **Last session:** <date> — <what got done, one line>
- **State:** <e.g. "P1 awaiting approval" · "P3 module 4/9 (menu) in progress, AC-012.3 failing">
- **Next action:** <the exact first step for the next session>
- **Load:** <files and sections or line ranges to read first>
- **Inputs:** <where external sources are cached in the repo, with versions and commits>
- **Waiting on user:** <decision or approval, or "nothing">
