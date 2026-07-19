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
| `POST /dimensions/time-periods` | Create governed time period | DONE |
| `PATCH /dimensions/time-periods/{time_period_code}` | Update governed time period | DONE |
| `DELETE /dimensions/time-periods/{time_period_code}` | Deactivate governed time period | DONE |
| `GET /dimensions/time-period-sets` | List reporting sequences/time-period member sets | DONE |
| `GET /dimensions/time-period-sets/{set_code}/periods` | List periods in a reporting sequence | DONE |
| `POST /dimensions/time-period-sets` | Create reporting sequence with selected periods | DONE |
| `PATCH /dimensions/time-period-sets/{set_code}` | Update reporting sequence and selected periods | DONE |

## Rules
- Data endpoints require bearer auth.
- Use `MASTERS:list` and `MASTERS:view` behavior from API.
- GET endpoints have no request body.
- Use `locale` query param and/or `Accept-Language`.
- Time-period sets support regular and irregular reporting sequences by storing ordered `TIME_PERIOD` dimension members in `dimension_member_sets`.
