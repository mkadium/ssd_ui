# RELEASE NOTES

| Field | Value |
|---|---|
| Module | Data Entry UI |
| Status | DEPARTMENT_DATA_ENTRY_SAMPLE_DATA |
| Last Updated | 2026-05-31 |

## v0.1.0
- Added `/data-entry` route.
- Added assigned request item inbox.
- Added full data-entry workspace with Excel-like template canvas.
- Added selected cell context, validation hints, cell comment, and submission note UX.
- Added save draft, validate, preview submit, and submit visual actions.
- Added sanitized preview submit modal.
- Updated `/data-entry` to use a standalone external-link layout with no left navigation.
- Fixed numeric canvas cell editing so the focused input remains active instead of reverting to selection mode.
- Added spreadsheet-style keyboard editing for selected numeric cells using digit, decimal, backspace, delete, Enter, and arrow keys.
- Added `ssd_ui/ui/src/data/dataEntry.sample.ts` with request/template/ingestion-shaped sample data.
- Registered route behind authenticated route guard.
