# UI CONTRACTS

## Templates UI Contract
- Read-only template list, detail, version, and render-contract views are allowed.
- `/templates` is implemented as a unit-scoped sample-data management surface.
- Template list must show template status, active/current version, mapped national/global indicator, source/owning unit context, cell counts, and row actions.
- Designer UI may be prototyped with sample data, but persistence is blocked until mutation APIs exist.
- Designer grid must bind visible cells to governed public contract keys: `template_code`, `version_code`, `axis_code`, `measure_code`, `cell_code`, `dimension_code`, and `member_code`.
- Dimension binding UX must support geography row axis, time merged headers, area type/gender column groups, show-header toggle, row/column alignment, editable/required/access options, and validation rule references.
- Do not expose internal IDs, raw metadata, secrets, or tokens.
