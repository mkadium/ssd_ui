# PAGE FLOWS

| Flow ID | Flow | Status |
|---|---|---|
| MASTERS-FLOW-001 | Framework edition and hierarchy inspection | IMPLEMENTED_SAMPLE_DATA |
| MASTERS-FLOW-002 | Indicator Management by selected indicator | IMPLEMENTED_SAMPLE_DATA |
| MASTERS-FLOW-003 | Reference Masters by category | IMPLEMENTED_SAMPLE_DATA |
| MASTERS-FLOW-004 | Organization/officer/source assignment inspection | IMPLEMENTED_SAMPLE_DATA |
| MASTERS-FLOW-005 | Framework hierarchy creation affordances and mapping coverage drilldown | IMPLEMENTED_SAMPLE_DATA |
| MASTERS-FLOW-006 | Data Field Library source, periodicity, and template grain usage | IMPLEMENTED_LOCAL_BUILD_VERIFIED |

## Implemented Framework Setup Flow

1. Authenticated user opens `/masters/frameworks`.
2. App Shell shows the current working-unit selector; page shows active framework edition summary and dynamic hierarchy structure.
3. User can inspect framework edition records, hierarchy levels, hierarchy nodes, parent-child relationships, selected-node readiness, and indicator mappings for the selected setup unit.
4. Hierarchy labels such as Goal/Target come from `metadata.framework_hierarchy_levels`; they are not fixed UI concepts.
5. User can start Create level or New parent/root node from the hierarchy workspace.
6. User selects a node and starts Add child from the selected-node panel; the modal shows parent context and the configured child level.
7. Hierarchy search preserves parent context for child matches and shows node depth.
8. Indicator coverage drilldown starts at top-level nodes, drills into children, and opens indicator detail from mapped indicators.

## Implemented Indicator Management Flow

1. Authenticated user opens `/masters/indicators`.
2. Page shows national indicators in a full-width table.
3. User selects an indicator and reviews related tabs: overview, versions, metadata, global mapping, and source assignments.
4. National indicator create/edit uses a dynamic framework-node dropdown filtered by `allows_indicator_mapping=true`.
5. Source assignments are related rows, so one indicator can have primary, secondary, and review sources.
6. Active version and pending changes against the active version are visible before source/mapping edits.
7. Source organization/officer/periodicity are edited in source assignment forms, not in the base indicator form.

## Implemented Reference Masters Flow

1. Authenticated user opens `/masters/reference`.
2. Page shows tabs for locales, organizations, officers, periodicities, units, and measures.
3. Each tab has table-specific stats, search, table, row action buttons, and modal create/edit/delete states.
4. Officer forms map the officer to a ministry/department/division via organization selection.
5. Measure forms reference Units through `unit_code`.

## Implemented Data Field Library Flow

1. Authenticated user opens `/data-fields/library`.
2. Page loads a table-ready list of measures/data fields for the selected or derived unit context using `GET /masters/data-fields`.
3. User filters by source/ministry/department, periodicity, UOM, availability/status, or text search.
4. User clicks a data-field row and opens the full Data Field detail workspace at `/data-fields/library?measure={measure_code}` using `GET /masters/data-fields/{measure_code}`.
5. Overview tab shows name, code, indicator/version context, UOM, status, default source, periodicity, template grain guidance, usage, and last approved/reference period.
6. Source Mapping tab maps one measure to one or more source organizations using searchable organization dropdowns.
7. Periodicity tab maps the measure to collection/reporting periodicity using searchable periodicity dropdowns.
8. Template Grain tab shows read-only grain usage derived from Template Studio draft/published design state, grouped by template, indicator, source, columns, rows, and tabs.
9. The table-level View Grain action opens the same template-derived grain usage without opening the whole detail workflow.
10. Used In tab shows template/request/reporting usage when API supports it.
11. Save is allowed only after dropdown selections resolve to stable codes.
12. Data Field create/edit/deactivate uses the existing indicator-version measure APIs before source and periodicity mappings are configured.
