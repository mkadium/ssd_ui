# RELEASE NOTES

| Field | Value |
|---|---|
| Module | Templates UI |
| Status | TEMPLATE_MANAGEMENT_SAMPLE_DATA |
| Last Updated | 2026-05-31 |

## v0.1.0
- Created UI module context from ready Templates API contract.
- Implemented unit-scoped Template List + Designer sample-data screen at `/templates`.
- Added template list search/filter table with mapped national/global indicator, current version, status, and row actions.
- Added template draft creation, dimension value preview, template detail, and delete visual modal states.
- Added Excel-like designer preview with merged time headers, geography row axis, area type/gender columns, full-text match suggestions, and scrollable binding options panel.
- Added contract tab showing selected template version, axes, measures, and public stable codes.
- Added `ssd_ui/ui/src/data/templatesManagement.sample.ts` with contract-shaped template sample data.
- Registered `/templates` route behind the authenticated route guard.
- Verified lint and production build.
