# API USAGE

## Module
Requests UI

| API | UI Usage | Status |
|---|---|---|
| `GET /requests/health` | DEV/UAT smoke check | DONE |
| `GET /requests/cycles` | Collection cycle list | DONE |
| `GET /requests/cycles/{cycle_code}` | Cycle detail | DONE |
| `GET /requests` | Request queue/list | DONE |
| `GET /requests/{request_code}` | Request detail | DONE |
| `GET /requests/{request_code}/items` | Request item list | DONE |
| `GET /requests/{request_code}/items/{item_code}` | Item detail | DONE |
| `GET /requests/{request_code}/items/{item_code}/scope-members` | Item scope | DONE |
| `GET /requests/{request_code}/items/{item_code}/template-instance` | Template instance | DONE |
| `GET /requests/{request_code}/assignments` | Request assignments | DONE |
| `GET /requests/assignments/{assignment_code}` | Assignment detail | DONE |
| `GET /requests/dispatch-policies` | Dispatch Settings list and filters | API_DEV_SMOKE_PASSED_PENDING_BROWSER_SMOKE |
| `GET /requests/dispatch-policies/effective` | Effective policy preview for unit/template/source scope | API_DEV_SMOKE_PASSED_PENDING_BROWSER_SMOKE |
| `POST /requests/dispatch-policies` | Create/update dispatch settings from drawer form | API_DEV_SMOKE_PASSED_PENDING_BROWSER_SMOKE |
| `PATCH /requests/dispatch-policies/{policy_code}` | Edit dispatch settings from drawer form | API_DEV_SMOKE_PASSED_PENDING_BROWSER_SMOKE |
| `PATCH /requests/dispatch-policies/{policy_code}/status` | Activate/deactivate dispatch settings | API_DEV_SMOKE_PASSED_PENDING_BROWSER_SMOKE |
| `GET /requests/dispatch-plans` | Dispatch Plan list/detail shell | API_COMPILE_PASSED_PENDING_LIVE_SMOKE |
| `POST /requests/dispatch-plans` | Create dispatch plan from right drawer | API_COMPILE_PASSED_PENDING_LIVE_SMOKE |
| `PATCH /requests/dispatch-plans/{dispatch_plan_code}` | Edit reusable dispatch plan | API_COMPILE_PASSED_PENDING_LIVE_SMOKE |
| `PATCH /requests/dispatch-plans/{dispatch_plan_code}/status` | Activate/deactivate dispatch plan | API_COMPILE_PASSED_PENDING_LIVE_SMOKE |
| `GET /requests/dispatch-runs` | Dispatch Run list for selected unit/plan | API_COMPILE_PASSED_PENDING_LIVE_SMOKE |
| `POST /requests/dispatch-plans/{dispatch_plan_code}/runs` | Create run for Request Period and generated Reporting Period | API_COMPILE_PASSED_PENDING_LIVE_SMOKE |

## Rules
- Data endpoints require bearer auth.
- Use `REQUESTS:list` and `REQUESTS:view` behavior from API.
- GET endpoints have no request body.
- Dispatch Settings uses stable policy, unit, template, and source codes only.
- Dispatch Plans use stable unit, template version, dispatch policy, indicator, request-period, and reporting-period codes only.
- Dispatch Runs are created from a plan and must not mutate the published template structure.
- DEV-backed local API smoke passed on 2026-07-23 for dispatch policy list, effective global, create SOURCE, effective SOURCE without template context, update, deactivate, and fallback to global. Browser smoke for `/requests/dispatch-settings` remains pending.
- Dispatch Plan and Run route compile passed on 2026-07-23; live API/browser smoke remains pending.
