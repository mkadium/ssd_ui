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
- These are UI-only sample controls until Templates/Dimensions API v0.2 render-contract endpoints are implemented.
