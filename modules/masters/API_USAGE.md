# API USAGE

## Module
Masters UI

| API | UI Usage | Status |
|---|---|---|
| `GET /masters/health` | DEV/UAT smoke check | DONE |
| `GET /masters/locales` | Language metadata | DONE |
| `GET /masters/frameworks` | Framework edition list | READY_FOR_UI_INTEGRATION |
| `GET /masters/frameworks/{framework_code}/hierarchy` | Dynamic hierarchy level/node browser | READY_FOR_UI_INTEGRATION |
| `GET /masters/indicators` | Indicator list/search | READY_FOR_UI_INTEGRATION |
| `GET /masters/indicators/{indicator_code}` | Indicator detail | READY_FOR_UI_INTEGRATION |
| `GET /masters/indicator-versions/{version_code}` | Version/measures detail | READY_FOR_UI_INTEGRATION |
| `GET /masters/periodicities` | Periodicity dropdowns | READY_FOR_UI_INTEGRATION |
| `GET /masters/organizations` | Ministry/department/division lists | READY_FOR_UI_INTEGRATION |
| `GET /masters/officers` | Officer list/search | READY_FOR_UI_INTEGRATION |
| `GET /masters/source-assignments` | Indicator source ownership | READY_FOR_UI_INTEGRATION |

## Rules
- Data endpoints require bearer auth.
- Use `MASTERS:list` and `MASTERS:view` behavior from API.
- GET endpoints have no request body.
- Use `locale` query param and/or `Accept-Language`.
- Current Framework Edition Setup uses local sample data only; live API integration is pending.
- Current Framework Setup, Indicator Management, and Reference Masters screens use local sample data only; live API integration is pending.
