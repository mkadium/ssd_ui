# AI CONTEXT

## Module
Dimensions UI

## Status
DIMENSIONS_MANAGEMENT_SAMPLE_DATA

## Current Understanding
- API contract: `ssd_api/modules/dimensions/API_CONTRACTS.md`.
- API evidence: `DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED`.
- Implementation root: `ssd_ui/ui/src/`.
- Context root: `ssd_ui/modules/dimensions/`.
- Current API surface is read-only.
- Route implemented: `/dimensions`.
- Current UI implementation: `ssd_ui/ui/src/pages/dimensions/DimensionsManagementPage.tsx`.
- Sample data: `ssd_ui/ui/src/data/dimensionsManagement.sample.ts`.
- Dimension Management is unit-scoped through the shared App Shell unit selector.
- The screen uses local sample data shaped from the Dimensions API/DB contract; no live Dimensions API calls yet.
- UI create/edit/delete/bulk upload controls are visual states only until governed Dimensions mutation APIs exist.
- Current screen includes enriched dimension summary cards, a second-row searchable dimension selector beside the member hierarchy tree, a full-width selected-member panel, create-dimension modal state, root/child creation modal states, member table, member sets, geography records, time periods, dependency/usage panel, search, pagination affordance, and bulk upload/download format affordance.
- New root member creation allows editable `dimension_code` for new dimension drafts; child/edit flows keep dimension context locked to protect hierarchy consistency.

## Scope
- Dimension definitions, members, member sets, geographies, and time periods.
- Use parent-child filters to render hierarchy browsers.
- Do not implement CRUD/mutation behavior until governed API contracts exist.
