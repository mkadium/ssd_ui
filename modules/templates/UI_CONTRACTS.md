# UI CONTRACTS

## Templates UI Contract
- Template UI must use `ssd_ui/frontend/src/` as the active implementation root.
- Template Library must consume governed Templates APIs, not local sample data.
- Template Studio must preserve stable public codes:
  - `template_code`
  - `version_code`
  - `axis_code`
  - `measure_code`
  - `cell_code`
  - `dimension_code`
  - `member_code`
  - `member_set_code`
- UI must not expose internal UUIDs to users or route state.
- Unit scope comes from the App Shell selected unit for Super Admin, or authenticated user unit for unit-scoped users.
- Locale scope comes from the App Shell locale selector.

## Template Library
- Must show governed template definitions and versions from API.
- Must allow creating template definitions and draft versions through API-backed drawer forms.
- Must use full-width table layout by default.
- Row click must open selected template profile and versions in a right-side drawer/panel.
- Version details should be loaded only when needed and cached during the session to avoid slow row preview/detail opens.
- The Template Library table must show a Status column. Status filtering must be current-version aware: use `current_version_status` / `version_status` when present, and use template definition status only as secondary context.
- Must route version design work to `/template/studio`.

## Template Studio Step Contract
- Structure: default first working step; manage template axes and structure rules.
- Recipients: derived from selected measure/data-field source assignments, source officers when available, periodicity mappings, template-designed grain axes, generated-column visibility, and source-specific column visibility rules.
- Preview: summarize template identity, version, structure counts, recipient groups, validations, generated outputs, and Excel-style output before publish.
- Publish: only after readiness checks; UI must show blocking reasons before calling the publish API when the local contract is already incomplete.
- Publish must save active primary provider policies for all active source mappings of each editable measure before calling the publish endpoint. One measure may have multiple primary providers in one template.
- Validation configuration remains available from column-level controls and is saved as validation rule/reference data.
- Indicator mapping is handled outside the Studio wizard sequence.

## Template Mappings
- Template Mappings must show only published/active template versions.
- Row selection must open a mapping workspace for the selected published version.
- The selected template header must show the template/version name and a View action.
- View must open a large read-only preview modal showing the published template structure in an Excel-style layout.
- Mapping must support selecting one or more indicators for the published template version.
- Template Mapping must not edit template structure, recipients, validations, generated outputs, or source/provider policies.
- Template Mapping must persist selected indicators through the governed Template Indicator Mapping API backed by `templates.template_indicator_mappings`.
- Studio draft metadata fields such as `indicatorMappings`, `mappedIndicators`, and `indicatorMapping` must not be used as approved mapping source of truth.
- Indicator Detail and Data Field Detail must treat source, periodicity, UOM, officer, and template grain usage as read-only published-template-derived information.

## Template Structure Builder Contract
- Structure page uses a left data library and Excel-style live preview.
- Structure must remain compact enough for 1366x768 users to see the library, drop zones, and preview without excessive page scrolling.
- Left data library must include only:
  - General dimension member sets
  - Geography member sets
  - Time-period reporting sequence sets
  - Measures/Data Fields
- Left data library must not show unrelated raw metadata tables.
- Dimensions, Geography, and Time Period tabs must default to Sets mode but may allow Members mode.
- Members mode must allow dragging individual governed members without changing the underlying member set.
- Template Studio draft state must preserve set/member identity with explicit item types:
  - `DIMENSION_SET` / `DIMENSION_MEMBER`
  - `GEOGRAPHY_SET` / `GEOGRAPHY_MEMBER`
  - `TIME_SET` / `TIME_MEMBER`
- Structure drop zones are:
  - Separate Into Tabs By
  - Each Row Represents / Row Levels
  - Show Across Columns / Column Levels
  - Fields To Fill
- Each Row Represents must support dynamic ordered row levels:
  - Row Level 1 is backward compatible with the old `builder.rowRepresents` field.
  - New drafts must persist `rowLevels`.
  - Old drafts without `rowLevels` must load by treating `builder.rowRepresents` as `rowLevels[0]`.
  - Users may add or remove row levels without a fixed maximum.
  - Each row level may contain a member set or individual member.
  - Preview must render separate left-side row header columns, for example Country | State | District.
  - Member sets expand across lower-level row headers using cartesian product behavior unless a governed hierarchy relationship is later supplied by API.
- Show Across Columns must support dynamic ordered column levels:
  - Column Level 1 is backward compatible with the old `builder.columns` field.
  - New drafts must persist `columnLevels`.
  - Old drafts without `columnLevels` must load by treating `builder.columns` as `columnLevels[0]`.
  - Users may add or remove column levels without a fixed maximum.
  - Each level may contain a member set or individual member.
  - Member sets expand across all lower-level columns using cartesian product behavior.
  - Measures bind only to final leaf data-entry columns.
  - Preview must render dimension/geography/time grouping headers once, and render measure UOM/validation controls only on the final editable leaf header.
- The separate Calculated Fields drop zone is removed from the current Structure UI. Compute, Calculated, and Rollup outputs are added through Settings and appear in Fields To Fill.
- Dragging a member set into rows or columns should preview member items in the table builder.
- Dragging measures into Fields To Fill should preview editable cells.
- Compute, Calculated, and Rollup outputs in Fields To Fill must appear as preview columns, not only as selected chips.
- Generated preview columns are non-editable and must repeat under every active column group such as each selected year/time period.
- Generated preview columns are hidden from Data Entry by default.
- Generated preview columns may be marked visible to Data Entry from the Settings drawer. Visible generated columns remain read-only/autocalculated for providers.
- Draft generated columns may be added back to preview or removed from the draft from the Settings drawer without recreating the formula.
- Recipient/source views must be generated from:
  - readable combined template grain paths from tabs, column levels, and row levels
  - editable measure columns assigned to that source
  - generated columns explicitly allowed for Data Entry
  - the `show all columns to recipients` setting
- Recipient grain display should use combined collection paths such as `2026 - Total/Rural/Urban - States`, not separate row/column chips.
- Recipient source display must split parent and child organizations: parent ministry in Source/Ministry and mapped department/division/agency in Department. If the mapped organization has no parent, show it in Source/Ministry and show Department as `-`.
- Recipients must allow filtering by source group when multiple sources are generated for the selected template measures.
- Default recipient/source behavior must hide non-assigned editable measure columns.
- Recipient readiness must require available source/officer contact information. If source or cadence exists but no officer is available for the source organization, show the row as needing review.
- Rollup outputs must come from approved dimension rollup rules. If no applicable rollup rule exists for the selected structure, the Studio must show an empty rollup state instead of allowing ad hoc rollup expression creation.
- Dropping directly on preview row headers, column headers, or cells must update the matching structure zone.
- Preview settings may support code visibility, zebra rows, compact cells, and editable-cell highlighting.
- The library search must apply only to the active library tab.
- Member-set item counts should use actual set members when catalog count is unavailable.
- Recipient readiness must use stable measure/data-field codes and must not expose internal IDs.
- Template Studio is the source of truth for collection grain. Data Field Library may show read-only Template Grain Usage, but new grain decisions must come from the saved template structure for the specific template/version/source/indicator/measure context.
- Preview must show the full main template, structure configuration, source-specific data entry views, validation rules, and generated output visibility before Publish.
- Source-specific Preview must render an Excel-style template view, not only summary cards. It should keep the same row/time/dimension grain and show only columns visible to that source, plus generated outputs explicitly enabled for Data Entry.
- Saved draft validations must hydrate back into the active Studio validation state when Edit Studio opens.
- Publish readiness must block when editable measures do not have active source/provider mappings.
- When a template version is published, the final contract must be materialized through governed template tables such as axes, axis members, cells, cell-axis bindings, render elements, validation references, and measure/provider policies. Studio draft JSON remains the editable design snapshot, not the downstream source of truth.
- Current UI v0.9 persists Studio draft JSON, time axes, editable measures, formula outputs, validation bindings, and measure provider policies. Full publish materialization of preview cells, axis-member tuples, and render elements is the next Template Studio implementation gap before data-entry/ingestion can rely only on relational template contract tables.

## Governed Time-Period Contract
- `TIME_PERIOD` must be represented as a governed template axis.
- Recommended default behavior is `FROM_REQUEST`.
- `FROM_REQUEST` means the request cycle supplies the exact reporting period; Template Studio should not hardcode the period.
- `CONTRIBUTOR_SELECT` means the data provider can select one or more periods from a governed time-period set during data entry.
- `FIXED_SET` means the template references a specific approved time-period set and should be used only when the template is intentionally year/cycle-specific.
- Published or used time-period sets are immutable. New cycles or changed member lists require a new time-period set/version.
- Template Studio may reference immutable time-period sets but must not edit their membership.
- If users need a different year sequence, they must create a new set in the Time Periods page and map that set to the template axis.
- Template Studio may also create a new time-period reporting sequence set for convenience, as long as it creates a new set/version and does not mutate an existing used/published set.

## Warnings
- Do not create hidden sample persistence for template designer state; use the governed Studio draft/formula persistence endpoints after API restart from latest code.
- Do not mutate time-period sets from Template Studio.
- Do not hardcode Goal/Target naming.
- Do not bypass API contracts for template versions, axes, measures, cells, binding groups, render elements, or validation refs.
