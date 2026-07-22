# UI CONTRACTS

## Module

Masters / Metadata UI

## Status

MASTERS_UOM_UI_INTEGRATED

## Framework Management Contract

The Framework Management screen must support unit-scoped framework editions after WP-2026-012 is implemented.

Required screens/areas:

- Framework Editions
- Hierarchy Levels
- Dynamic Framework level pages under the Framework left navigation
- Framework Nodes
- Parent/Child Relationships
- Locales
- Periodicities
- Unit of Measurement (UOM)
- Sources / Ministries
- Officers
- Super Admin selected-unit context
- Unit Admin derived-unit context

## Unit Context Behavior

| Scenario | Expected UI Behavior |
|---|---|
| Super Admin login | Show Unit dropdown in top bar |
| Super Admin changes unit | Reload unit-scoped framework edition and hierarchy data |
| Unit Admin login | Hide Unit dropdown |
| Unit Admin data load | Use mapped user unit from auth/session context |
| Missing unit context | Show safe production message and block unit-scoped Framework actions |

## Framework Edition Form

Fields:

- Unit, required for Super Admin
- Framework code
- Edition code
- Edition name
- Version label
- Description
- Effective from
- Effective to
- Status
- Active flag

Validation:

- Unit is required for Super Admin create/update.
- Framework code and edition code must use stable-code format.
- Only one active framework edition is allowed per unit and framework.
- If a user attempts to activate another edition for the same unit/framework, show: `Deactivate the current active edition for this unit and framework before activating another.`

## Display Rules

- Framework list must show the owning unit code/name where space allows.
- Framework Editions table must use Framework-specific column widths and compact truncation; Masters reference table width rules must not globally compress Framework columns.
- Framework left navigation must show the Framework admin page first, followed by dynamic pages for each active hierarchy level in the selected/derived unit's active framework.
- Dynamic level page labels must come from API level names such as Goal/Target for SDG, but must not be hardcoded.
- Dynamic level routes may use the stable `level_code`; the visible page label should remain localized.
- Dynamic level pages must render nodes for the selected level from the active unit framework hierarchy.
- Dynamic level pages must provide KPI cards, search by node number/name/code, grid/list toggle, color-aware cards, compact list rows, and an Open action placeholder until detailed node workflow is governed.
- Child node counts may be computed from active framework relationships.
- Framework node indicator counts must use API-provided `indicator_count`, which is derived from active `framework_indicator_mappings`; parent level pages may show descendant indicator counts.
- If a level is the indicator-mapping/last level, the dynamic level page must hide child-node KPI/card counts, show parent-level filters from active relationships, show parent node code in list rows, and use mapped indicator counts instead.
- Goal/parent level cards and list rows must show the API-provided indicator count. Do not infer counts from indicator names, display numbers, or SDG-specific assumptions.
- Framework hierarchy tabs must show data only for the selected or derived unit.
- Changing unit context must clear prior selected framework state and reload.
- UI must use localized labels from API where available and stable codes as fallback.
- Masters reference screens must use compact viewport-aware tables and right-side drawers; notices must render as toast messages without shifting page layout.
- Code fields such as periodicity, UOM, organization, and officer codes should auto-generate from names but remain editable before save.
- UOM screen must manage stable `uom_code`, localized name/description, symbol, type, sort order, and active status.
- UOM table must display name, code, symbol, type, sort order, and active/inactive state; filters/search must work without reloading the whole application shell.
- Long stable codes and labels must be truncated in table cells with browser tooltip support, while the right-side detail panel must show the full value without table overflow.
- UOM create/edit must use the right-side drawer pattern shared with the other Masters pages.

## Indicator Library Contract

- Indicator Library must load national indicators from `/masters/indicators` using selected `unit_code` and locale.
- Indicator Library must use a full-width table with row click behavior. Narrow side panels are not sufficient for production indicator metadata.
- Indicator Library filters must include source ministry/department search, periodicity, status, UOM, and text search using `/masters/indicators` list-summary fields.
- Indicator Library must not call the detail endpoint once per visible table row for source/UOM/periodicity/global display. Detail calls should happen only when a row is opened or a specific detail action requires it.
- Indicator row click must replace the main content with a separate indicator detail page, not an inline/bottom workspace.
- Indicator detail must use `/masters/indicators/{indicator_code}` and render official metadata, metadata status, related hierarchy, `Details`, and `Mapping` sections.
- Details tab must render overview, versions, measures, source assignment, metadata, and availability information section-wise.
- Mapping tab must not render a separate framework section in Indicator detail. Framework context is shown through dynamic hierarchy labels and navigation.
- Mapping tab must render global indicator mapping as the only editable mapping section in Indicator detail.
- Source, periodicity, source officer, UOM, and measure sections must be read-only in Indicator detail and derived from `published_template_usage` only.
- Existing direct source assignment, source officer, UOM, measure, and periodicity records may remain in the database/API for backward compatibility or planning/reference workflows, but Indicator Detail must not show them as operational usage unless they are also present through published template usage.
- Masters such as UOM, sources/ministries, officers, and periodicities are maintained in Masters pages. Template Studio and data-field provider policy own operational source/provider mappings.
- Data Source Ministry and Department/Division on Indicator Detail must resolve from `published_template_usage` ministry/department fields. If no published template usage exists, show an empty/pending state instead of falling back to direct indicator source assignments.
- Base indicator creation must use the selected unit's active framework/edition and `POST /masters/indicators`; advanced source/measure/global/framework mapping saves must use the governed mapping endpoints.
- Indicator detail hierarchy labels and Open actions must use API-provided `framework_mappings`; do not hardcode Goal/Target.
- Parent node detail pages must list child nodes from active framework relationships and show mapped indicators through `/masters/framework-indicator-mappings?node_code=...`.
- Parent node detail pages must use compact viewport-aware layout, show child nodes without long descriptions, and allow mapped indicator rows to open the Indicator Library detail page through `?indicator={national_indicator_code}`.
- Indicator Library must show an explicit loading state when opening an indicator detail record.
- Indicator records must use stable `national_indicator_code`, `version_code`, `measure_code`, `uom_code`, `periodicity_code`, `organization_code`, and `officer_code` as keys.
- Indicator create/edit workflow should be implemented as a governed multi-section flow: Basic, Framework Mapping, Metadata, Measures, Source Assignment, Version History, and Language.
- Indicator Mapping tab may use existing upsert endpoints for Global Indicator Mapping only. Do not expose direct source assignment, source officer, UOM, measure, or periodicity map/unmap controls on Indicator detail.
- Indicator detail must show UOM and measures as separate sections because version-level UOM and measure-level UOM are different concepts.
- Framework node mapping belongs to `framework_indicator_mappings`; indicators should not be auto-created as framework nodes unless future governance approves indicator-as-level behavior.

## Global Indicator Contract

- Global Indicators page must be available under Indicator Management.
- Global Indicators page must list global indicators by selected/derived `unit_code` and locale using `/masters/global-indicators`.
- Global Indicators page must support search, status filter, create, edit, activate/deactivate where supported by the API, and a compact detail panel.
- Global indicator create/edit must use the right-side drawer pattern and must require framework edition, global indicator code, indicator number, localized name, and active status.

## Data Field / Measure Library Contract

- Data Field Library must be available under the Data Fields module and must manage governed indicator measures as schedulable data fields.
- Data Field Library must use a full-width table, compact row height, and viewport-aware scrolling for 1366x768.
- Filters must include source/ministry/department, periodicity, UOM, status/availability, and free-text search.
- Row click must open a dedicated Data Field profile/detail workspace, not a cramped side panel. The detail workspace must provide tabs for Overview, Indicator, Source Mapping, Periodicity, Template Grain Usage, and Used In.
- Data Field create/edit/deactivate must use the existing indicator-version measure routes and stable `version_code` / `measure_code` values.
- Source Mapping must allow one measure to map to multiple source organizations using stable `organization_code`.
- Periodicity Mapping must allow measure-level collection cadence using stable `periodicity_code`.
- Template Grain Usage is read-only in the Data Field Library. It must be derived from saved Template Studio draft/published design state and grouped by Template, Indicator, Source, and Grain.
- Template Grain Usage must display the submission coordinate structure designed in that template, for example `2026 - Total / Rural / Urban - States` or `2026 - Total / Rural / Urban - States - Sex`.
- Do not create new editable measure-level grain mapping UI unless governance later approves a shared default-grain model. The same measure may have different grain by template/source/indicator.
- Mapping forms must open in the shared right-side drawer pattern and use searchable dropdowns. Do not render mapping forms inline below the table.
- UI must disable Save when a searchable dropdown has typed text but no selected stable-code record.
- Data Field list rows must not require one detail API call per visible row; source, UOM, periodicity, availability, usage count, and last approved/reference period should come from the list endpoint once API supports it. Template Grain Usage may load lazily only when the user opens the grain view.
- Data collection scheduling UX must explain that template/data-field provider policy and approved template/request overrides drive collection. Indicator source/UOM/periodicity/officer mappings are reference defaults for profile and planning screens, not the operational publish contract.
- Do not use localized names as keys. Use `measure_code`, `version_code`, `organization_code`, `periodicity_code`, `uom_code`, `dimension_code`, `member_code`, `member_set_code`, geography code, and time-period code.
