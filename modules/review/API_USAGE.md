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
