# PAGE FLOWS

| Flow ID | Flow | Status |
|---|---|---|
| REVIEW-FLOW-001 | Review queue to task detail | PLANNED |
| REVIEW-FLOW-002 | Task detail to validation/report/data-entry context | PLANNED |
| REVIEW-FLOW-003 | Task actions and approvals history | PLANNED |

## Implemented Review Flow

1. Authenticated reviewer opens `/review`.
2. User sees reviewer task queue with search and status filter.
3. User opens a task row.
4. UI shows review workspace with indicator context, goal/target path, validation summary, template/data preview, selected cell detail, previous actions, approval history, and request-to-dashboard trail.
5. User can open approve/reject/send-back/request-clarification modal states.
6. Review actions are not submitted to API; they are visual-only until governed mutation support is approved.
