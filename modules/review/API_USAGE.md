# API USAGE

## Module
Review UI

| API | UI Usage | Status |
|---|---|---|
| `GET /review/health` | DEV/UAT smoke check | DONE |
| `GET /review/statuses` | Review status labels | DONE |
| `GET /review/action-types` | Review action labels | DONE |
| `GET /review/tasks` | Review task queue | DONE |
| `GET /review/tasks/{task_code}` | Task detail | DONE |
| `GET /review/tasks/{task_code}/actions` | Task action history | DONE |
| `GET /review/tasks/{task_code}/approvals` | Task approval history | DONE |
| `GET /review/actions/{action_code}` | Action detail | DONE |
| `GET /review/approvals/{approval_code}` | Approval detail | DONE |
| `GET /review/submission-versions/{version_code}/tasks` | Tasks by submission version | DONE |
| `GET /review/validation-runs/{run_code}/tasks` | Tasks by validation run | DONE |

## Rules
- Data endpoints require bearer auth.
- API currently uses `VALIDATION:list` and `VALIDATION:view` because `REVIEW:*` permissions are not seeded.
- GET endpoints have no request body.
- Review action mutations are not implemented.
## 2026-06-04 UI Integration Update

- `ReviewApprovalPage` now reads reviewer tasks from `GET /review/tasks?unit_code=SDG&status={status}&locale=en-IN`.
- Opening a task reads actions and approvals from:
  - `GET /review/tasks/{task_code}/actions?unit_code=SDG&locale=en-IN`
  - `GET /review/tasks/{task_code}/approvals?unit_code=SDG&locale=en-IN`
- Reviewer actions call `POST /review/tasks/{task_code}/actions`.
- Approve calls `POST /review/tasks/{task_code}/approvals`; `is_final_approval=true` is sent when the current review level is the max level.
- Comment is required in the UI before submitting a review action/approval.
- Previous-approved comparison and template/data preview remain the next wiring target for richer review context; do not expose raw payload or metadata JSON.
