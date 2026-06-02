# AI CONTEXT

## Module
Masters UI

## Status
MASTERS_CATEGORIZED_WORKSPACES_SAMPLE_DATA

## Current Understanding
- API contract: `ssd_api/modules/masters/API_CONTRACTS.md`.
- API evidence: `DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED`.
- Implementation root: `ssd_ui/ui/src/`.
- Context root: `ssd_ui/modules/masters/`.
- Current API surface is read-only.
- Framework Edition Setup implemented: `ssd_ui/ui/src/pages/masters/FrameworkEditionSetupPage.tsx`.
- Indicator Management implemented: `ssd_ui/ui/src/pages/masters/IndicatorManagementPage.tsx`.
- Reference Masters implemented: `ssd_ui/ui/src/pages/masters/ReferenceMastersPage.tsx`.
- Route implemented: `/masters/frameworks`.
- Route implemented: `/masters/indicators`.
- Route implemented: `/masters/reference`.
- Current Framework Setup screen uses contract-shaped sample data from `ssd_ui/ui/src/data/frameworkSetup.sample.ts`; no live Masters API calls yet.
- Indicator Management and Reference Masters use contract-shaped sample data from `ssd_ui/ui/src/data/mastersManagement.sample.ts`; no live Masters API calls yet.
- Masters UI is now categorized by workflow:
  - Framework Setup: framework editions, hierarchy levels, hierarchy nodes, node relationships, framework indicator mappings.
  - Indicator Management: national indicators, global indicators, national/global mappings, indicator versions, metadata details, indicator source assignments.
  - Reference Masters: locales, ministries/departments/divisions through organizations, officers, periodicities, units, and measures.
- Framework hierarchy is dynamic from `metadata.framework_hierarchy_levels`; SDG Goal/Target are sample seeded records only and must not be hardcoded as UI structure.
- Framework Setup now uses the shared App Shell unit selector and includes explicit Create level, New parent/root node, and selected-node Add child flows so parent-child hierarchy creation is understandable at any configured depth and unit scope.
- Framework Setup includes searchable hierarchy tree behavior where child matches retain parent context, selected nodes show depth, and coverage drilldown shows mapped-indicator counts by node.
- Add child forms show selected parent context and constrain the child level to configured levels below the parent level.
- Indicator mapping targets must use framework nodes whose level has `allows_indicator_mapping=true`.
- One national indicator may have multiple source assignments via `org.indicator_source_assignments`; UI must show/add them as related rows, not as a single source field only.
- Indicator Management shows active version context and pending change rows against that active version.
- Indicator Management now includes a Measures tab for multiple indicator measures and DB v0.2-oriented defaults: unit, value type, decimal places, validation rule code, aggregation type, and required flag.
- Source organization/officer/cadence selection belongs to source assignment rows, not the base indicator form.
- Officers are mapped to organizations in Reference Masters; indicator forms should not duplicate officer organization mapping.
- Units are represented as a Reference Master and are referenced by indicator measures.
- Framework and masters screens now follow the enterprise UX direction: category-specific workspaces, row actions, relation-aware modal forms, hierarchy tree navigation, search/filter/pagination patterns, and minimal page copy.
- UI create/edit/delete/map actions are visual states only until governed Masters mutation APIs exist.

## Scope
- Framework edition, hierarchy, indicator, global mapping, periodicity, measure, organization, officer, and source-assignment screens.
- Use stable codes and localized labels from API.
- Do not implement CRUD/mutation behavior until governed API contracts exist.

## Warnings
- Do not hardcode domain labels that should come from API metadata.
- Do not rely on unapproved packages present in the merged UI scaffold.
- Framework setup screen must remain read-only until Masters mutation APIs are governed and implemented.
- Indicator/source mapping modals are UI previews only; no create/update/delete request is sent.
