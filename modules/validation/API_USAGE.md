# API USAGE

## Module
Validation UI

| API | UI Usage | Status |
|---|---|---|
| `GET /validation/health` | DEV/UAT smoke check | DONE |
| `GET /validation/rules` | Rule list | DONE |
| `GET /validation/rules/{rule_code}` | Rule detail | DONE |
| `GET /validation/bindings` | Rule binding list | DONE |
| `GET /validation/runs` | Validation run list | DONE |
| `GET /validation/submission-versions/{version_code}/runs` | Runs for submission version | DONE |
| `GET /validation/runs/{run_code}` | Run detail | DONE |
| `GET /validation/runs/{run_code}/summary` | Run summary cards | DONE |
| `GET /validation/runs/{run_code}/report` | Full report | DONE |
| `GET /validation/runs/{run_code}/results` | Results table | DONE |
| `GET /validation/results/{result_code}` | Result detail | DONE |
| `GET /validation/results/{result_code}/comparison` | Comparison evidence | DONE |

## Rules
- Data endpoints require bearer auth.
- Use `VALIDATION:list` and `VALIDATION:view` behavior from API.
- GET endpoints have no request body.
- Validation execution trigger is not available.
