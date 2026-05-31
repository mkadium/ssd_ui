# API USAGE

## Module
Dimensions UI

| API | UI Usage | Status |
|---|---|---|
| `GET /dimensions/health` | DEV/UAT smoke check | DONE |
| `GET /dimensions` | Dimension definition list | DONE |
| `GET /dimensions/{dimension_code}` | Dimension detail | DONE |
| `GET /dimensions/{dimension_code}/members` | Member hierarchy/list | DONE |
| `GET /dimensions/member-sets` | Member-set list | DONE |
| `GET /dimensions/member-sets/{set_code}/members` | Member-set detail | DONE |
| `GET /dimensions/geographies` | Geography hierarchy/list | DONE |
| `GET /dimensions/geographies/{geography_code}` | Geography detail | DONE |
| `GET /dimensions/time-periods` | Time-period list | DONE |
| `GET /dimensions/time-periods/{time_period_code}` | Time-period detail | DONE |

## Rules
- Data endpoints require bearer auth.
- Use `MASTERS:list` and `MASTERS:view` behavior from API.
- GET endpoints have no request body.
- Use `locale` query param and/or `Accept-Language`.
