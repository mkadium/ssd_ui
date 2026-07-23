# RELEASE NOTES

| Field | Value |
|---|---|
| Module | Masters UI |
| Status | MASTERS_INDICATOR_REFERENCE_MAPPING_ALIGNED |
| Last Updated | 2026-07-22 |

## v0.1.1

- Fixed Indicator hierarchy dropdown clipping by removing section-level overflow and keeping scrolling on the parent drawer form.

- Fixed Indicator drawer hierarchy dropdowns by giving Goal/Target selectors the full drawer width for long labels.

- Modernized national and global indicator create/edit drawers with refined editor surfaces, structured global-reference sections, modern active controls, and contextual footer actions.

- Applied the shared accessible loader to the Indicator Library and Global Indicators pages.

- Modernized shared Masters create/edit drawers with structured details and behavior sections, responsive fields, switch controls, governance guidance, and contextual footer actions.

- Fixed reference-page route transitions flashing an incorrect empty state before Locales, Periodicities, UOM, Units, or Officers data loaded.

- Applied the shared accessible loader to Locales, Periodicities, UOM, Units, and Officers reference pages.

- Applied the shared accessible loader to the Framework overview and dynamic GOAL/TARGET level pages.

- Added Unit of Measurement (UOM) as a governed Masters reference page under `/masters/uom`.
- Integrated UOM list/create/update through the shared Masters reference API client.
- UOM page manages stable `uom_code`, localized name/description, symbol, type, sort order, and active state.
- Fixed long UOM code/table overflow by truncating compact table cells and keeping full values available through tooltips and the detail panel.
- Added dynamic Framework level navigation under the Framework module; labels load from the selected or derived unit's active hierarchy levels.
- Implemented the dynamic Framework level page with active node browsing, KPI cards, search, grid/list views, color-aware cards, compact rows, and child counts from active relationships.
- Dynamic Framework level pages keep indicator/readiness values pending until governed API mapping/coverage data is available.
- Fixed Framework Editions table column compression by scoping compact Masters table rules to Masters reference tables and adding Framework-specific column widths.
- Fixed Framework sidebar active-state behavior so the Framework admin page is not selected when a dynamic level page is active.
- Added the first Indicator Library page using selected-unit Masters indicator APIs with search, status filter, compact table, and detail sections for versions, measures, sources, metadata, and mappings.
- Redesigned Indicator Library into a full-width table with ministry/department, periodicity, status, and UOM filters plus a row-driven Details/Mapping workspace.
- Changed Indicator Library row click behavior to open a separate main-content detail page with official metadata, metadata status, related hierarchy, and mapping sections.
- Added base Indicator create drawer using the selected unit active framework/edition and improved source ministry/department display through organization hierarchy lookup.
- Added dynamic indicator hierarchy navigation using framework mapping path data, parent node detail routing, target-row parent-detail selection, and node-based mapped indicator reads.
- Updated dynamic Framework level pages to use API indicator counts, hide child counts on indicator-mapping/last levels, add dynamic parent filters, and show parent node codes for target-style rows.
- Optimized Indicator Library table rendering to use enriched `/masters/indicators` summary fields instead of loading detail records for each visible row.
- Simplified Indicator detail hierarchy hero to show only dynamic parent and mapped node labels without long descriptions.
- Tightened parent framework node detail layout for 1366x768, removed child-node descriptions from the left list, and enabled mapped indicator click-through to Indicator Library detail.
- Added explicit Indicator detail loading state and separated UOM from Measures in the Mapping tab.
- Added available upsert/deactivate controls for framework mapping, global mapping, source assignment, and measure sections in Indicator detail.
- Removed the separate Framework mapping section from Indicator detail and moved remaining mapping edits into compact right-side drawer forms.
- Split Indicator Mapping source assignment from source officer recipient assignment to match the database model.
- Changed Indicator Mapping drawers to fixed right-side forms with searchable dropdown inputs for global indicators, sources, officers, periodicities, UOMs, and measures.
- Removed direct Indicator-detail map/unmap controls for source assignment, periodicity, source officer recipients, UOM, and measure metadata. Only Global Indicator Mapping remains editable from Indicator detail.
- Kept source, periodicity, source officer, UOM, and measure sections read-only and changed them to display only `published_template_usage` from active/current published template contracts.
- Fixed Indicator Library source ministry/department filtering to use stable organization codes from the loaded source options.
- Added Global Indicators under Indicator Management with list, search, status filter, detail panel, and right-drawer create/edit.
- Added Data Field Library under `/data-fields/library` using WP-2026-011 APIs for list, profile, source mapping, periodicity mapping, unmap, and restore flows.
- Added Data Field create/edit/deactivate drawer backed by existing indicator-version measure APIs.
- Changed Data Field row click to open a dedicated full-width detail workspace instead of a cramped side profile panel.
- Added compact Data Field table filters for source, periodicity, UOM, status, and text search.
- Added Data Field profile tabs for Overview, Indicator, Source, Periodicity, and Template Grain Usage with clean empty states.
- Replaced active measure-level grain editing in the Data Field UI with read-only Template Grain Usage derived from Template Studio draft/published design state.
- Added right-side Data Field mapping drawers with stable-code dropdown validation for source organizations, periodicities, dimensions, members, member sets, geographies, and time periods.
- Verified production frontend build after Data Field Library integration.
- Verified production frontend build after UOM integration.

## v0.1.0
- Created UI module context from ready Masters API contract.
- Implemented Framework Edition Setup sample-data foundation.
- Added route `/masters/frameworks`.
- Added framework hierarchy browser, active edition summary, readiness checklist, object relationship map, and indicator mapping readiness table.
- Implemented categorized Indicator Management and Reference Masters sample-data foundations.
- Added route `/masters/indicators`.
- Added indicator table, selected-indicator related tabs, reference master tabs, stats, searchable tables, row detail/action modals, dynamic hierarchy browser, and relation-aware forms.
- Verified local lint and production build with approved dependencies.
- Refactored Masters screens toward the approved enterprise UX direction: fewer explanatory sections, CRUD-first list/table layouts, selected-record details, direct row actions, hierarchy tree navigation, modal form states, search/filter/pagination patterns, and less-rounded shared card styling.
- Reworked `/masters/indicators` into Indicator Management focused on national indicators and related objects.
- Added `/masters/reference` for locales, organizations, officers, periodicities, and measures.
- Updated framework hierarchy UI to use dynamic hierarchy levels/nodes instead of fixed Goal/Target assumptions.
- Added relation-aware modal forms for national indicators, framework mappings, global mappings, organizations, officers, and source assignments.
- Updated source-assignment UI to represent multiple sources per indicator.
- Added explicit Framework Setup actions for Create level, New parent/root node, and Add child.
- Moved Framework Setup unit scope into the shared App Shell selector so all operational pages use one unit context.
- Removed duplicate Add child action from the hierarchy-tree header; Add child now stays in the selected-node panel.
- Updated Add child modal to show parent node context and child-level selection based on configured hierarchy levels below the parent.
- Added framework hierarchy search with parent context, selected-node depth display, mapping coverage drilldown, searchable indicator accordions, and indicator detail modal.
- Removed source organization/officer/cadence fields from the base indicator form; source mapping is now represented as multiple source-assignment rows.
- Added active-version and pending-change context to Indicator Management.
- Added Units as a Reference Master and linked Measures to Units through `unit_code`.
- Added Indicator Management Measures tab with DB v0.2-oriented measure defaults: decimal places, validation rule code, aggregation type, unit, value type, and required flag.
- Updated Reference Masters stats to be table-specific instead of generic for every master.
- Replaced remaining modal "Save draft" labels in Masters flows with "Save/Submit".
