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

## Rules
- Data endpoints require bearer auth.
- Use `REQUESTS:list` and `REQUESTS:view` behavior from API.
- GET endpoints have no request body.
