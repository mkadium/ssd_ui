# RELEASE NOTES

| Field | Value |
|---|---|
| Module | Dimensions UI |
| Status | DIMENSION_LIBRARY_API_INTEGRATED |
| Last Updated | 2026-07-18 |

## v0.3.0
- Modernized Dimension drawers with refined fields, switch controls, sticky actions, parent-level scrolling, and unclipped dropdown overflow.
- Applied the shared accessible loader to Dimension Library, Geography, and Time Periods.
- Added API-backed Time Periods page at `/dimensions/time-periods`.
- Added frequencies, period list, create/edit/deactivate flow, and reporting sequence management.
- Reporting sequences support regular and irregular year selections through `TIME_PERIOD` member sets.
- Used reporting sequences now show as immutable and support Copy as New Cycle/Version instead of in-place period mutation.
- Added UI handling for API-provided reporting sequence usage metadata and lock reason.
- Added compact styling for 1366x768 usability.

## v0.2.0
- Added live API-integrated Dimension Library at `/dimensions/library`.
- Added Dimensions API client for stat cards, management rows, detail, members, relationships, member sets, rollups, and aliases.
- Reworked Dimensions UI into a Framework-style ordered tab workflow: Dimensions, Members, Hierarchy, Member Sets, Rollups, Aliases.
- Added right-side drawer forms for dimension, member, relationship, member set, alias, and rollup create/update flows where API support exists.
- Applied compact 1366x768-friendly table and tab styling.

## v0.1.0
- Created UI module context from ready Dimensions API contract.
- Implemented unit-scoped Dimension Management sample-data screen at `/dimensions`.
- Added dimension definition selector, hierarchy tree, selected-member detail, usage/dependency panel, member table, member sets, geography, and time-period tabs.
- Added root/child/edit/delete and bulk upload/download modal affordances as visual states only.
- Added New dimension modal affordance because dimension definitions are extensible beyond seeded examples.
- Made `dimension_code` editable for New root member flow while keeping Add child dimension locked to selected parent context.
- Added Dimension selector search and enriched stat cards with active/root/child counts, hierarchy state, member-set scope counts, and dependency usage context.
- Rebalanced the Dimension Management layout so summary stats sit first, Dimensions and Member hierarchy share the second row, and Selected member expands full width below them.
- Added DB v0.2 rollup sample data and a Rollups tab for parent-member entry modes, aggregation methods, validation rule codes, and rollup children.
- Added `ssd_ui/ui/src/data/dimensionsManagement.sample.ts` with contract-shaped dimensions sample data.
- Registered `/dimensions` route behind the authenticated route guard.
- Verified lint and production build.
