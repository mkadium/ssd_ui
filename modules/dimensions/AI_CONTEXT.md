# AI CONTEXT

## Module
Dimensions UI

## Status
DIMENSION_LIBRARY_API_INTEGRATED

## Current Understanding
- API contract: `ssd_api/modules/dimensions/API_CONTRACTS.md`.
- API evidence: `DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED`.
- Implementation root: `ssd_ui/frontend/src/`.
- Context root: `ssd_ui/modules/dimensions/`.
- Route implemented: `/dimensions/library`.
- Current UI implementation: `ssd_ui/frontend/src/pages/dimensions/dimension-library-page.tsx`.
- API client: `ssd_ui/frontend/src/api/dimensions.api.ts`.
- Dimension Management is unit-scoped through the shared App Shell unit selector.
- The screen uses live Dimensions API calls for stat cards, management rows, dimension details, members, relationships, member sets, rollups, and aliases.
- UI create flows use governed Dimensions mutation APIs where available.
- Current screen follows the Framework-style workflow pattern: KPI cards, filters, a single tabbed workflow card, and right-side drawer forms.
- Tab sequence: Dimensions, Members, Hierarchy, Member Sets, Rollups, Aliases.
- Geography and Time Periods now have specialized left-nav pages. Dimension Library excludes those specialized catalogs from the generic list where the specialized page provides the clearer workflow.
- Time Periods supports immutable used reporting sequences. Admins must copy used sequences as a new cycle/version before changing ordered periods.

## Scope
- Dimension definitions, members, member sets, geographies, and time periods.
- Use parent-child filters to render hierarchy browsers.
- Use stable codes only; do not expose internal IDs.
- Keep dimensions as governed global/reference data. Unit selector may scope usage metrics only.
