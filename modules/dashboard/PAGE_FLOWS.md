# PAGE FLOWS

| Flow ID | Flow | Status |
|---|---|---|
| DASHBOARD-FLOW-001 | Super Admin dashboard overview to drilldown | IMPLEMENTED_SAMPLE_DATA |
| DASHBOARD-FLOW-002 | Unit Admin goal/target/indicator dashboard | IMPLEMENTED_SAMPLE_DATA |
| DASHBOARD-FLOW-003 | Submitted snapshot dashboard after approval | IMPLEMENTED_SAMPLE_DATA |

## Implemented Super Admin Flow

1. User lands on `/dashboard/super-admin`.
2. App Shell shows role-aware navigation, dashboard selector, `EN` language selector, reminder count, notification count, tour, and admin controls.
3. Main dashboard shows first-demo workflow status, summary cards, unit/goal/pipeline/review charts, top pending items, planned operations, infrastructure monitor, and drilldown table.
4. Cards, charts, queue rows, pending items, and monitor statuses update the drilldown panel with representative table rows.

## Implemented Unit Admin Flow

1. Authenticated user lands on `/dashboard/unit-admin`.
2. App Shell shows Unit Admin persona and the dashboard selector.
3. Main dashboard shows required/requested/submitted/validation/review summary cards for a source unit.
4. Goal and target charts summarize level-1 and level-2 progress.
5. Indicator table links each row to request, submission, validation, review, due-date, and template context.
6. Selected action panel guides the user toward data entry, validation report, or review trail.

## Implemented Submitted Snapshot Flow

1. Authenticated user lands on `/dashboard/snapshot`.
2. App Shell shows Dashboard Publisher persona and the dashboard selector.
3. Main dashboard shows approved, published, pending-publication, goal-coverage, and public-boundary summary cards.
4. Charts summarize goal publication coverage and publication mix.
5. Source contribution list shows unit-level publication health.
6. Published indicator snapshot table shows approved/published rows only; protected review evidence remains internal.
