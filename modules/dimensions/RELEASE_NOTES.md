# RELEASE NOTES

| Field | Value |
|---|---|
| Module | Dimensions UI |
| Status | DIMENSION_LIBRARY_API_INTEGRATED |
| Last Updated | 2026-07-17 |

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
