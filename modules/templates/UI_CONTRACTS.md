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
- Must route version design work to `/template/studio`.

## Template Studio Step Contract
- Structure: default first working step; manage template axes and structure rules.
- Recipients: derived from measure source assignments, source officers, periodicity, and required grain.
- Preview: summarize contract shape before publish.
- Publish: only after readiness checks.
- Validation configuration remains available from column-level controls and is saved as validation rule/reference data.
- Indicator mapping is handled outside the Studio wizard sequence.

## Template Structure Builder Contract
- Structure page uses a left data library and Excel-style live preview.
- Structure must remain compact enough for 1366x768 users to see the library, drop zones, and preview without excessive page scrolling.
- Left data library must include only:
  - General dimension member sets
  - Geography member sets
  - Time-period reporting sequence sets
  - Measures/Data Fields
- Left data library must not show unrelated raw metadata tables.
- Structure drop zones are:
  - Separate Into Tabs By
  - Each Row Represents
  - Show Across Columns
  - Fields To Fill
- The separate Calculated Fields drop zone is removed from the current Structure UI. Compute, Calculated, and Rollup outputs are added through Settings and appear in Fields To Fill.
- Dragging a member set into rows or columns should preview member items in the table builder.
- Dragging measures into Fields To Fill should preview editable cells.
- Compute, Calculated, and Rollup outputs in Fields To Fill must appear as preview columns, not only as selected chips.
- Generated preview columns are non-editable and must repeat under every active column group such as each selected year/time period.
- Rollup outputs must come from approved dimension rollup rules. If no applicable rollup rule exists for the selected structure, the Studio must show an empty rollup state instead of allowing ad hoc rollup expression creation.
- Dropping directly on preview row headers, column headers, or cells must update the matching structure zone.
- Preview settings may support code visibility, zebra rows, compact cells, and editable-cell highlighting.
- The library search must apply only to the active library tab.
- Member-set item counts should use actual set members when catalog count is unavailable.

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
