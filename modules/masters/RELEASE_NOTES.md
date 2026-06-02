# RELEASE NOTES

| Field | Value |
|---|---|
| Module | Masters UI |
| Status | MASTERS_CATEGORIZED_WORKSPACES_SAMPLE_DATA |
| Last Updated | 2026-06-01 |

## v0.1.0
- Created UI module context from ready Masters API contract.
- Implemented Framework Edition Setup sample-data foundation.
- Added route `/masters/frameworks`.
- Added framework hierarchy browser, active edition summary, readiness checklist, object relationship map, and indicator mapping readiness table.
- Implemented categorized Indicator Management and Reference Masters sample-data foundations.
- Added route `/masters/indicators`.
- Added indicator table, selected-indicator related tabs, reference master tabs, stats, searchable tables, row detail/action modals, dynamic hierarchy browser, and relation-aware forms.
- Verified local lint and production build with approved dependencies.
- Refactored Masters screens toward the approved enterprise UX direction: fewer explanatory sections, CRUD-first list/table layouts, selected-record details, direct row actions, hierarchy tree navigation, modal form states, search/filter/pagination patterns, and less-rounded shared card styling.
- Reworked `/masters/indicators` into Indicator Management focused on national indicators and related objects.
- Added `/masters/reference` for locales, organizations, officers, periodicities, and measures.
- Updated framework hierarchy UI to use dynamic hierarchy levels/nodes instead of fixed Goal/Target assumptions.
- Added relation-aware modal forms for national indicators, framework mappings, global mappings, organizations, officers, and source assignments.
- Updated source-assignment UI to represent multiple sources per indicator.
- Added explicit Framework Setup actions for Create level, New parent/root node, and Add child.
- Moved Framework Setup unit scope into the shared App Shell selector so all operational pages use one unit context.
- Removed duplicate Add child action from the hierarchy-tree header; Add child now stays in the selected-node panel.
- Updated Add child modal to show parent node context and child-level selection based on configured hierarchy levels below the parent.
- Added framework hierarchy search with parent context, selected-node depth display, mapping coverage drilldown, searchable indicator accordions, and indicator detail modal.
- Removed source organization/officer/cadence fields from the base indicator form; source mapping is now represented as multiple source-assignment rows.
- Added active-version and pending-change context to Indicator Management.
- Added Units as a Reference Master and linked Measures to Units through `unit_code`.
- Added Indicator Management Measures tab with DB v0.2-oriented measure defaults: decimal places, validation rule code, aggregation type, unit, value type, and required flag.
- Updated Reference Masters stats to be table-specific instead of generic for every master.
- Replaced remaining modal "Save draft" labels in Masters flows with "Save/Submit".
