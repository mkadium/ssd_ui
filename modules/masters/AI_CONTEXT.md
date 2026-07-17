# AI CONTEXT

## Module

Masters / Metadata UI

## Related Work Packets

- WP-2026-002: Master Metadata and i18n-Ready Schema Design
- WP-2026-012: Unit-Scoped Framework Edition Ownership

## Current Architecture

- UI implementation uses the approved React/Vite source-root exception: `ssd_ui/ui/src/`.
- Module traceability is maintained in `ssd_ui/modules/masters/`.
- Framework Management UI must support framework editions, hierarchy levels, nodes, and node relationships.
- Framework left navigation must add dynamic hierarchy level pages under the Framework module after the Framework admin page.
- Dynamic Framework level pages are derived from the selected or authenticated unit's active framework hierarchy levels.
- Dynamic Framework level pages render active nodes for the selected level using hierarchy API data. They support KPI cards, search, grid/list view, node colors, child counts computed from active relationships, and API-provided indicator counts from framework indicator mappings.
- Indicator-mapping/last-level pages hide child-node counts, show dynamic parent filters from active relationships, show parent node code in list rows, and use mapped indicator counts.
- Indicator Library is implemented as a full-width Indicator Management page using existing Masters APIs. It lists selected-unit national indicators, supports filters for source ministry/department, periodicity, status, and UOM, and opens a separate main-content indicator detail page with official metadata, status, hierarchy, Details, and Mapping sections.
- Indicator Library can create the base national indicator record using the selected unit's active framework/edition. Source assignment, officer, measure, UOM, global mapping, periodicity, and metadata update flows are displayed from available APIs and are edited through right-side drawer forms where integrated.
- Indicator source ministry/department, UOM, periodicity, and global mapping display should come from `/masters/indicators` list-summary fields. Detail fallback may resolve through indicator source assignments and organization hierarchy only after a row is opened.
- Indicator detail should use `framework_mappings` from `/masters/indicators/{indicator_code}` for dynamic hierarchy labels and Open parent/mapped node navigation.
- Dynamic framework node detail pages should use `/masters/framework-indicator-mappings?node_code=...` to list indicators mapped under a selected node.
- Dynamic framework node detail pages should use compact viewport-aware layout and allow mapped indicator rows to open Indicator Library detail through `?indicator={national_indicator_code}`.
- Framework-node indicator counts are available on hierarchy node rows as `indicator_count`; parent nodes include descendant mapping counts.
- Masters reference UI includes Locales, Periodicities, Unit of Measurement (UOM), Sources / Ministries, and Officers.
- The UOM page is implemented through the shared Masters reference page pattern and uses `/masters/uom` list/create/update APIs.
- Indicator detail Mapping tab no longer shows a separate Framework section. It supports available upsert-style edits for global mapping, source assignment/officer mapping, version-level UOM, and measures through compact right-side mapping drawers. Deactivation uses `is_active=false`; hard delete is not implemented.
- Indicator detail separates version-level Unit of Measurement from measure rows because these are different DB concepts.
- Global Indicators page is implemented under Indicator Management using `/masters/global-indicators` list/create/update APIs. It supports search, status filter, compact table, detail panel, and right-drawer create/edit.
- DEC-2026-006 requires framework editions to be unit-owned.
- Super Admin must be able to select the active unit context from the top bar.
- Unit Admin and ordinary unit-scoped users should use the unit assigned through authentication/user role context and do not need a top-bar Unit dropdown by default.

## Unit Context Rule

| User Type | Unit Context Source | Top-Bar Unit Dropdown |
|---|---|---|
| Super Admin | Selected unit dropdown | Visible |
| Unit Admin | Authenticated user's mapped unit | Hidden |
| Unit-scoped officer/contributor | User/request assignment | Hidden |

## Framework Page Rules

- Framework page must load framework editions by selected or derived `unit_code`.
- Framework navigation must load hierarchy levels from the active framework for the selected or derived `unit_code`.
- Level nav labels must use localized API level names, not hardcoded Goal/Target labels.
- Level page labels, card labels, and child-count labels must use API level names dynamically and must not hardcode SDG-only names.
- If the selected unit has no active framework levels, only the Framework admin page should be shown.
- Framework Edition form must include Unit selection for Super Admin.
- Active validation must be unit-scoped.
- The UI must not show stale framework hierarchy after selected unit changes.
- Framework child data remains scoped through the selected framework edition.

## AI Warnings

- Do not implement final API integration until WP-2026-012 DB and API contracts are ready.
- Do not expose internal `unit_id` in UI routes, forms, or API query construction.
- Do not treat active framework edition as global.
- Do not hardcode SDG-only framework behavior.
- Do not compute Goal/Target indicator counts from guesses. Use API-provided `indicator_count` from hierarchy nodes.
- Do not treat UOM display names as keys. Use stable `uom_code`; localized names/descriptions are display content only.
