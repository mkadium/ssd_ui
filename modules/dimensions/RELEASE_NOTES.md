# RELEASE NOTES

| Field | Value |
|---|---|
| Module | Dimensions UI |
| Status | DIMENSIONS_MANAGEMENT_SAMPLE_DATA |
| Last Updated | 2026-05-31 |

## v0.1.0
- Created UI module context from ready Dimensions API contract.
- Implemented unit-scoped Dimension Management sample-data screen at `/dimensions`.
- Added dimension definition selector, hierarchy tree, selected-member detail, usage/dependency panel, member table, member sets, geography, and time-period tabs.
- Added root/child/edit/delete and bulk upload/download modal affordances as visual states only.
- Added New dimension modal affordance because dimension definitions are extensible beyond seeded examples.
- Made `dimension_code` editable for New root member flow while keeping Add child dimension locked to selected parent context.
- Added Dimension selector search and enriched stat cards with active/root/child counts, hierarchy state, member-set scope counts, and dependency usage context.
- Rebalanced the Dimension Management layout so summary stats sit first, Dimensions and Member hierarchy share the second row, and Selected member expands full width below them.
- Added `ssd_ui/ui/src/data/dimensionsManagement.sample.ts` with contract-shaped dimensions sample data.
- Registered `/dimensions` route behind the authenticated route guard.
- Verified lint and production build.
