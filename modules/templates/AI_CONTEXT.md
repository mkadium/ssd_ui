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
  - `/template/mappings`
- Backend API source:
  - `ssd_api/api/templates/`
  - `ssd_api/modules/templates/API_CONTRACTS.md`

## Implemented UI Behavior
- Template Library is API-backed for template list and selected template versions.
- Template Library supports search, status filter, styled KPI cards, selected template profile, version list, create-template drawer, and create-version drawer.
- Template Library status display and filtering are current-version aware. Use `current_version_status` / `version_status` first, keep definition status only as secondary context, and do not rely on definition status alone for published/draft UI state.
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
- Template Studio supports dynamic multi-level column headers:
  - Existing saved `builder.columns` drafts are migrated in UI to `columnLevels[0]`.
  - New drafts persist `columnLevels` while keeping `builder.columns` as the level-1 compatibility mirror.
  - Each column level may contain member sets or individual members.
  - Preview expands column levels using cartesian product behavior, so upper-level sets repeat across lower-level set/member columns.
- Template Studio supports dynamic multi-level row headers:
  - Existing saved `builder.rowRepresents` drafts are migrated in UI to `rowLevels[0]`.
  - New drafts persist `rowLevels` while keeping `builder.rowRepresents` as the level-1 compatibility mirror.
  - Each row level may contain member sets or individual members.
  - Preview renders separate row header columns such as Country | State | District.
  - Current UI expansion uses ordered cartesian product behavior; hierarchy-aware pruning can be added when the API exposes parent-child filtered member expansion for selected sets.
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
- Left data library now supports Sets/Members mode for Dimensions, Geography, and Time Period:
  - Sets mode is the default.
  - Members mode allows individual dimension/geography/time-period members to be dragged into rows, columns, or tabs.
  - Draft JSON must preserve whether the selected item is a set or an individual member using distinct item types such as `DIMENSION_SET`, `DIMENSION_MEMBER`, `GEOGRAPHY_SET`, `GEOGRAPHY_MEMBER`, `TIME_SET`, and `TIME_MEMBER`.
- Template Studio Structure includes a Settings drawer with Compute, Calculated, and Rollup tabs.
- Compute, Calculated, and Rollup values added from Settings are treated as generated Fields To Fill.
- Generated Fields To Fill must become non-editable preview columns, not only chips in the Fields To Fill zone.
- Generated columns repeat inside every active column group. Example: if time periods are across columns and locality creates repeated editable columns, each year must show the normal editable measure columns plus the computed/calculated/rollup columns for that same year.
- Rollup columns are selected from existing Dimension Rollup rules. Template Studio must not recreate rollup expressions when a governed dimension rollup already exists.
- If no applicable dimension rollups are available for the current structure, the Rollup tab should show an empty state and should not invent sample rollups.
- Column validation creation uses the validation API/DB contract at template-version plus measure scope. UI preview column keys are stored only in rule configuration metadata and must not be sent as `cell_code` unless a real `templates.template_cells.cell_code` exists.
- Before saving validation for a dragged Data Field measure, Template Studio must ensure the selected template version has a matching `templates.template_measures` record. The source data field remains linked through `source_measure_code`; validation binding uses the registered template measure code.
- Computed/calculated/rollup outputs can be added to the current draft preview as non-editable generated columns.
- Generated output columns are hidden from Data Entry by default. The Settings drawer provides a `Show in Data Entry` option per generated column; enabled columns remain read-only/autocalculated for providers.
- Save Draft now calls the Template Studio draft/formula persistence APIs so Edit Studio can reload previously bound zones, cell mappings, preview settings, validation UI state, and generated output columns. DB v0.9.0 is DEV validated; UI live smoke requires API restart from latest code.
- Validation configuration remains available from column-level controls and is saved through the validation/template rule APIs, but the separate `Validation (optional)` wizard step is removed.
- Indicator mapping is handled outside the Studio step sequence; the separate `Indicator Mapping` wizard step is removed.
- Template Studio Recipients step is now implemented from selected measure/data-field mappings:
  - source organization mappings
  - source officer data when exposed by the data-field API, with UI fallback to active officers for the mapped source organization
  - periodicity mappings
  - readable combined template-designed grain paths from Structure, for example `2026 - Total/Rural/Urban - States`
- Recipient/source-specific views default to assigned editable measure columns only. The optional `Show all columns to recipients` setting can include non-assigned columns for context.
- Recipient/source-specific views include generated compute/calculated/rollup columns only when those generated columns are explicitly marked visible to Data Entry.
- Existing draft generated columns can be re-added to Fields To Fill from the Settings drawer without recreating the formula.
- Draft generated columns can also be removed from the Settings drawer; removal also removes them from Fields To Fill and any cell binding.
- Recipient source display resolves mapped department/division/agency to its parent ministry when organization metadata is available.
- Recipients supports filtering by generated source group when a template contains measures mapped to multiple sources.
- Template Studio Preview step now shows final contract summary, structure configuration, full read-only Excel-style preview, source-specific data entry views, validation rules, and generated output visibility.
- Source-specific Preview renders compact Excel-style template views using the same row/column grain as the main template but filters visible columns by source-owned measures and generated output visibility.
- Saved draft validations hydrate into active validation state on Edit Studio load; they are no longer shown only as available validations.
- Template Studio Publish step now shows readiness checks and blocks publish in UI when required source/provider mappings are missing before calling the publish API.
- Before publish, Template Studio persists provider policies for every active source mapping of each editable measure. If one measure has multiple active source mappings, all mapped sources are saved as active primary providers.
- Template Studio is the source of truth for grain. The Data Field Library may show read-only Template Grain Usage grouped by template, indicator, source, and grain, but Data Field Library should not create new measure-level grain mappings for template collection design.
- Template Mappings is the post-publish indicator mapping workspace:
  - It lists published/active template versions only.
  - It opens a selected published template in a large preview modal before mapping.
  - It allows one or more indicators to be selected for a published template version.
  - Selected mappings are persisted through the governed Template Indicator Mapping API backed by `templates.template_indicator_mappings`.
  - Studio draft metadata fields such as `indicatorMappings`, `mappedIndicators`, and `indicatorMapping` are not source of truth for approved template-indicator mappings.
  - Source, periodicity, UOM, officer, and grain usage shown on Indicator/Data Field detail pages must be derived from published template usage, not direct ad hoc editing on those pages.

## Governed Time-Period Behavior
- Template Designer must not directly mutate used or published time-period member sets.
- Normal recurring templates should use `FROM_REQUEST`, where the request cycle supplies the exact period.
- Provider-selectable periods should use `CONTRIBUTOR_SELECT` with an approved time-period set.
- Year-specific fixed layouts may use `FIXED_SET`, but new cycles should create a new time-period set/version.
- Used or published period sets are immutable references. If a future cycle needs different members, create a new set/version in the Time Periods module and reference that set from the template axis.
- Template Studio may create a new time-period reporting sequence set as a convenience, but it must not mutate an existing used/published set.

## Pending Work
- Persisting all non-time builder zones into the full template axis/cell/binding contract.
- Data-entry-time formula execution contract.
- Template instance/request-cycle behavior in downstream Requests/Data Entry modules.

## Warnings
- Use stable public codes in UI/API calls.
- Do not expose internal UUIDs.
- Do not edit time-period set membership from Template Studio.
- Do not hardcode SDG Goal/Target labels in template behavior.
- Preserve unit and locale scoping through App Shell selected context.
