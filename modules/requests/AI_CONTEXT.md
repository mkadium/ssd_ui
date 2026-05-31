# AI CONTEXT

## Module
Requests UI

## Status
COLLECTION_REQUEST_SAMPLE_DATA

## Current Understanding
- API contract: `ssd_api/modules/requests/API_CONTRACTS.md`.
- API evidence: `DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED`.
- Implementation root: `ssd_ui/ui/src/`.
- Context root: `ssd_ui/modules/requests/`.
- Current API surface is read-only.
- Route implemented: `/requests`.
- Current UI implementation: `ssd_ui/ui/src/pages/requests/CollectionRequestPage.tsx`.
- Sample data: `ssd_ui/ui/src/data/requestsManagement.sample.ts`.
- The screen is unit-scoped through the shared App Shell unit selector.
- Current UI includes compact collection cycle context, enterprise request records list, row-click large request detail modal, create request modal, template canvas preview modal, scope rows/JSON preview modals, follow-up modal, and send-confirm modal.
- Request dependent objects are shown inside the request detail modal: collection detail, item & scope, assignments, and status trail.
- The main page no longer has separate Items & Scope, Assignments, or Status Trail tabs because those objects are request-scoped and were confusing when shown outside the selected request.
- Item & scope defaults to a template canvas view; rows and JSON are secondary audit/troubleshooting views opened from the detail modal.
- The request code is not pinned as a common page context; it appears only in records, row actions, and request-specific modals.
- Create, send, follow-up, reminder, assignment, and scope actions are visual states only until governed mutation/token delivery APIs exist.
- UI must never display raw request tokens or token hashes.

## Scope
- Collection cycles, requests, request items, scope members, template instances, and assignments.
- Show request to ingestion/validation/review status trail using stable codes where available.
- Do not implement request creation, assignment mutation, or token generation.
