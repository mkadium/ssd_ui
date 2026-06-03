# AI CONTEXT

## Module
Data Entry UI

## Status
DEPARTMENT_DATA_ENTRY_INTERACTIVE_SAMPLE_FLOW

## Current Understanding
- Route implemented: `/data-entry`.
- Implementation root: `ssd_ui/ui/src/pages/data-entry/DepartmentDataEntryPage.tsx`.
- Sample data: `ssd_ui/ui/src/data/dataEntry.sample.ts`.
- The screen follows Requests -> Data Entry -> Ingestion flow.
- Main view is an assigned request item inbox.
- Clicking an assignment opens a full template data-entry workspace.
- `/data-entry` intentionally does not use the shared App Shell because it represents an external-link-style data entry page.
- No left navigation or dashboard chrome is shown on the data entry route.
- Workspace shows rendered template canvas, selected cell context, validation hints, cell comment, submission note, and draft/validate/preview/submit visual actions.
- UI-only in-action demo is implemented for selecting an assignment, editing selected template cells, recalculating missing required values, saving draft, validating, previewing submit, and visually submitting when validation is clear.
- Rendered template grid now supports governed cross-section columns: reporting year -> area type -> gender. Department users can edit numeric percent data cells and reporting year labels only.
- Year headers can be edited in place and new year groups can be added. Adding a year generates the same governed area type and gender columns for that year. Year labels warn unless they match the `YYYY-YY` display format, for example `2011-12`.
- Year groups can be deleted unless only one year remains. Year labels also warn on duplicate display values.
- Numeric value entry is constrained to percent-style numeric values with up to two decimals. Geography, area type, gender, measure, unit, required flag, and validation rule bindings remain template-controlled and are not editable in Data Entry.
- Data Entry grid supports keyboard interaction: arrow keys move the selected cell, Space selects the focused cell, Enter starts editing from a selected cell, and Enter/Escape exits edit mode from an active value editor.
- Preview submit includes a dynamic data-entry JSON object. It is regenerated from the current years, generated cross-section columns, row geography, and cell values so added/deleted years remain bound to the correct row objects.
- Data Entry now mirrors stacked template headers by showing the lowest dimension label with a measure/unit chip, while the sanitized JSON keeps `axis_tuple`, `measure_code`, `unit_code`, and `value_numeric` as separate governed fields.
- Preview submit is a visual modal only and does not execute an API mutation.

## Boundaries
- Do not expose raw tokens, token hashes, raw payload bodies, source hashes, internal database IDs, or metadata JSON.
- Save draft, validate, preview submit, and submit are local React state transitions until governed integration is added.
- Template cells display user-friendly labels but must eventually save against governed request item, template, measure, cell, and dimension codes.
- Data Entry may edit time labels only as a request-instance convenience in the UI prototype. Real persistence needs governed API support to decide whether this becomes a submitted value, request-period override, or template-instance metadata.
