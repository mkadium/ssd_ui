# UI CONTRACTS

## Templates UI Contract
- Read-only template list, detail, version, and render-contract views are allowed.
- `/templates` is implemented as a unit-scoped sample-data management surface.
- Template list must show template status, active/current version, mapped national/global indicator, source/owning unit context, cell counts, and row actions.
- Designer UI may be prototyped with sample data, but persistence is blocked until mutation APIs exist.
- Designer grid must bind visible cells to governed public contract keys: `template_code`, `version_code`, `axis_code`, `measure_code`, `cell_code`, `dimension_code`, and `member_code`.
- Dimension binding UX must support geography row axis, time merged headers, area type/gender column groups, show-header toggle, row/column alignment, editable/required/access options, and validation rule references.
- Do not expose internal IDs, raw metadata, secrets, or tokens.

## Template Designer v0.2 Notes

- Row number column remains sticky while the template canvas scrolls horizontally.
- Designer options support sample DB v0.2 binding behavior:
  - measure defaults: `INDICATOR_VALUE`, `PERSON_COUNT`, `POVERTY_RATE`
  - rollup entry modes: `MANUAL`, `DERIVED`, `MANUAL_WITH_VALIDATION`
  - aggregation methods: `SUM`, `AVG`, `WEIGHTED_AVG`, `MIN`, `MAX`, `NO_ROLLUP`
- JSON preview includes `binding_groups`, `measure`, `rollup_rules`, and `data_entry_binding_shape`.
- Blank-cell selection must reset the options context so stale binding-group settings are not shown for an unbound cell.
- Freeze and Editable cells are toggle actions:
  - Freeze marks a header/range for sticky/frozen rendering in the eventual data-entry view.
  - Editable cells marks or unmarks the selected range as department data-entry inputs.
- Measure-as-column behavior is represented as strict selected-measure binding. The user selects one available measure (`INDICATOR_VALUE`, `PERSON_COUNT`, `POVERTY_RATE`, etc.) and binds it to the selected header cell/range. Already-bound measures are removed from the picker until unbound, and each generated/submitted value must still carry its exact `measure_code`.
- Later dimension binding or axis re-alignment must preserve already-bound strict measure header cells instead of replacing them with dimension members.
- If strict measure headers are present, newly generated column-dimension headers must start below the measure header row so no Time/Area/Gender member is hidden under a preserved measure cell.
- Binding a column dimension while the selected cell is under a strict measure header must apply the dimension locally to that measure group and expand the measure header span to cover the generated dimension leaves. It must not force the dimension under the first measure or a global column axis.
- Expanding one strict measure group must preserve sibling measure groups. If the selected measure needs more columns, measure groups and local headers to the right shift right before the selected group is repainted.
- Unbinding a strict measure group must remove its local column dimensions and generated cells as one block. Unbinding a local dimension inside a strict measure group must affect only that selected measure group and must not remove dimensions from sibling measures.
- Merged header cells must remain directly editable. The editor must write text to the visible merge owner, not to a hidden merged child/focus cell.
- Local strict-measure header stacks must also relayout row-axis headers/members: row-axis headers merge across the full generated header depth, and row-axis members begin at the first data-entry row.
- Combine measure must work for strict measure groups as well as the older global measure-axis mode. In strict mode, it visually stacks measure/unit text under the deepest selected local dimension headers while keeping JSON relation codes separate.
- Combine measure is a visual render option. It may stack the selected dimension label above the measure/unit label, but saved/submitted structures must keep `dimension_code`, `member_code`, and `measure_code` separate.
- Vertical alignment options must affect the visible canvas cell alignment, not only JSON metadata.
- These are UI-only sample controls until Templates/Dimensions API v0.2 render-contract endpoints are implemented.
