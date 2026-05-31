# AI CONTEXT

## Module
Review UI

## Status
REVIEW_APPROVAL_SAMPLE_DATA

## Current Understanding
- API contract: `ssd_api/modules/review/API_CONTRACTS.md`.
- API evidence: `DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED`.
- Implementation root: `ssd_ui/ui/src/`.
- Context root: `ssd_ui/modules/review/`.
- Current API surface is read-only; review action mutations are not implemented.
- Route implemented: `/review`.
- Current UI implementation: `ssd_ui/ui/src/pages/review/ReviewApprovalPage.tsx`.
- Sample data: `ssd_ui/ui/src/data/review.sample.ts`.
- Main page shows reviewer task queue.
- Clicking a task opens a full review workspace.
- Workspace shows request -> data entry -> ingestion -> validation -> review -> dashboard context trail, indicator context, goal/target path, submitted-by/reviewer details, validation summary, template/data preview, review level, previous actions, approval history, selected cell detail, reviewer note, and visual action states.
- Approve/reject/send-back/request-clarification actions are visual-only modals until governed mutation APIs and permissions are approved.

## Scope
- Review statuses, action types, tasks, task detail, task actions, task approvals, action detail, approval detail, and task lookups by submission version/validation run.
- Use validation permission behavior documented by API until `REVIEW:*` permissions are seeded.
- Do not implement approve/reject/send-back/request-clarification actions.
- Do not expose raw payloads, metadata JSON, source hashes, internal IDs, tokens, token hashes, secrets, or sensitive full response bodies.
