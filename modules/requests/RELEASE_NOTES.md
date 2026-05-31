# RELEASE NOTES

| Field | Value |
|---|---|
| Module | Requests UI |
| Status | COLLECTION_REQUEST_SAMPLE_DATA |
| Last Updated | 2026-05-31 |

## v0.1.0
- Created UI module context from ready Requests API contract.
- Implemented unit-scoped Collection Request Creation sample-data screen at `/requests`.
- Added cycle selector, request list, create request modal, request detail modal, item/scope preview, assignments view, and status trail view.
- Refined Collection Request screen for enterprise usability with compact cycle context, selected-request context panel, lifecycle strip, row selection, DB-object creation sequence, full scope-member table, and assignment uniqueness guidance.
- Added request detail, scope preview, follow-up reminder, and send-confirm visual modal states.
- Simplified the Requests UX so the main tab shows request records only, row click opens detail in a modal, and create request is a modal action.
- Removed the confusing separate Items & Scope, Assignments, and Status Trail page tabs that made one request code appear like a common context.
- Refined the Requests UX again so Items & Scope, Assignments, and Status Trail now live inside one large request detail modal, matching the database relationship.
- Reworked Create Request into a cleaner two/three-column modal form and added a template canvas preview action.
- Changed item/scope presentation to template-canvas-first, with rows and JSON available as secondary preview modals.
- Added `ssd_ui/ui/src/data/requestsManagement.sample.ts` with contract-shaped request, item, scope, template instance, assignment, and status trail sample data.
- Registered `/requests` route behind the authenticated route guard.
- Verified lint and production build.
