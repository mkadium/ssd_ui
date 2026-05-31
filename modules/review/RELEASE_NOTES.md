# RELEASE NOTES

| Field | Value |
|---|---|
| Module | Review UI |
| Status | REVIEW_APPROVAL_SAMPLE_DATA |
| Last Updated | 2026-05-31 |

## v0.1.0
- Created UI module context from ready Review API contract.
- Added `/review` route.
- Added reviewer task queue with task/request/indicator/source/reviewer/status context.
- Added full review workspace with request-to-dashboard trail, indicator context, validation summary, template/data preview, selected cell detail, previous actions, approval history, reviewer note, and visual action buttons.
- Added approve, reject, send-back, and request-clarification visual modal states.
- Added sanitized cell/detail modal.
- Added `ssd_ui/ui/src/data/review.sample.ts` with contract-shaped review sample data.
