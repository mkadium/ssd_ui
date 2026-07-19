# AI CONTEXT

## Module
Templates UI

## Status
FRONTEND_API_BACKED_FOUNDATION

## Current Understanding
- Active implementation root: `ssd_ui/frontend/src/`.
- Template UI pages:
  - `ssd_ui/frontend/src/pages/templates/template-library-page.tsx`
  - `ssd_ui/frontend/src/pages/templates/template-studio-page.tsx`
- Template API client:
  - `ssd_ui/frontend/src/api/templates.api.ts`
- Active routes:
  - `/template/library`
  - `/template/studio`
- Backend API source:
  - `ssd_api/api/templates/`
  - `ssd_api/modules/templates/API_CONTRACTS.md`

## Implemented UI Behavior
- Template Library is API-backed for template list and selected template versions.
- Template Library supports search, status filter, styled KPI cards, selected template profile, version list, create-template drawer, and create-version drawer.
- Template Library loads version details lazily when a template row is opened and caches them for faster repeat preview/detail access.
- Template Studio provides the governed visible step sequence:
  - Structure
  - Recipients
  - Preview
  - Publish
- Template Studio currently implements the first production foundation for structure using governed `TIME_PERIOD` axis behavior.
- Template Studio Structure now uses a table-builder layout:
  - left data library
  - drag/drop structure zones
  - Excel-style live preview
- Template Studio follows the old UI builder pattern where the preview is compact, spreadsheet-like, and controlled by simple preview settings.
- Template Studio opens on Setup first. Structure is the second step in the create/edit flow.
- Template Studio Setup shows template identity as a compact form; the readiness side panel is intentionally removed to keep the design surface usable at 1366x768.
- Template Studio supports direct drag/drop into preview row headers, column headers, and editable cells; direct cell mapping updates the structure zones.
- The Time Period library tab can create a new reporting sequence set for a new cycle without editing old used sets.
- Left data library is intentionally limited to:
  - General dimension member sets
  - Geography member sets
  - Time-period reporting sequence sets
  - Measures/Data Fields
- Template Studio Structure includes a Settings drawer with Compute, Calculated, and Rollup tabs.
- Compute, Calculated, and Rollup values added from Settings are treated as generated Fields To Fill.
- Generated Fields To Fill must become non-editable preview columns, not only chips in the Fields To Fill zone.
- Generated columns repeat inside every active column group. Example: if time periods are across columns and locality creates repeated editable columns, each year must show the normal editable measure columns plus the computed/calculated/rollup columns for that same year.
- Rollup columns are selected from existing Dimension Rollup rules. Template Studio must not recreate rollup expressions when a governed dimension rollup already exists.
- If no applicable dimension rollups are available for the current structure, the Rollup tab should show an empty state and should not invent sample rollups.
- Column validation creation uses the validation API/DB contract at template-version plus measure scope. UI preview column keys are stored only in rule configuration metadata and must not be sent as `cell_code` unless a real `templates.template_cells.cell_code` exists.
- Before saving validation for a dragged Data Field measure, Template Studio must ensure the selected template version has a matching `templates.template_measures` record. The source data field remains linked through `source_measure_code`; validation binding uses the registered template measure code.
- Computed/calculated/rollup outputs can be added to the current draft preview as non-editable generated columns.
- Save Draft now calls the Template Studio draft/formula persistence APIs so Edit Studio can reload previously bound zones, cell mappings, preview settings, validation UI state, and generated output columns. DB v0.9.0 is DEV validated; UI live smoke requires API restart from latest code.
- Validation configuration remains available from column-level controls and is saved through the validation/template rule APIs, but the separate `Validation (optional)` wizard step is removed.
- Indicator mapping is handled outside the Studio step sequence; the separate `Indicator Mapping` wizard step is removed.

## Governed Time-Period Behavior
- Template Designer must not directly mutate used or published time-period member sets.
- Normal recurring templates should use `FROM_REQUEST`, where the request cycle supplies the exact period.
- Provider-selectable periods should use `CONTRIBUTOR_SELECT` with an approved time-period set.
- Year-specific fixed layouts may use `FIXED_SET`, but new cycles should create a new time-period set/version.
- Used or published period sets are immutable references. If a future cycle needs different members, create a new set/version in the Time Periods module and reference that set from the template axis.
- Template Studio may create a new time-period reporting sequence set as a convenience, but it must not mutate an existing used/published set.

## Pending Work
- Full template structure designer for dimensions, measures, binding groups, cells, and render elements.
- Persisting all non-time builder zones into the full template axis/cell/binding contract.
- Validation-rule mapping CRUD.
- Indicator/measure mapping UX.
- Recipient/source-specific column visibility and editable-column rules.
- Data-entry-time formula execution contract.
- Publish action wiring after final readiness checks are agreed.
- Template instance/request-cycle behavior in downstream Requests/Data Entry modules.

## Warnings
- Use stable public codes in UI/API calls.
- Do not expose internal UUIDs.
- Do not edit time-period set membership from Template Studio.
- Do not hardcode SDG Goal/Target labels in template behavior.
- Preserve unit and locale scoping through App Shell selected context.
