# RELEASE NOTES

| Field | Value |
|---|---|
| Module | Templates UI |
| Status | TEMPLATE_MANAGEMENT_CANVAS_FIX |
| Last Updated | 2026-06-01 |

## v0.1.1
- Fixed Template Designer canvas axis rebinding behavior.
- Froze the canvas row-number column during horizontal scrolling.
- Preserved the Geography `Location` header when later binding Time Period, Area Type, Gender, or Measure options.
- Removed accidental Time Period auto-binding when binding Area Type or Gender.
- Fixed column-aligned Geography so members start at the first canvas column instead of leaving an empty leading column.
- Preserved existing column axes during rebuilds so adding Area Type under Geography expands each Geography member instead of replacing Geography.
- Fixed Row align / Column align so already-bound dimensions move immediately between row and column axes without duplicate rebuilds; new unbound dimensions still use Bind values to place them.
- Added first-pass DB v0.2 designer controls for measure defaults and Area Type rollup behavior.
- Extended JSON preview with sample binding groups and rollup rules for enterprise template designer handoff.

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
