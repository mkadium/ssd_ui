# API USAGE

## Module
Templates UI

| API | UI Usage | Status |
|---|---|---|
| `GET /templates/health` | DEV/UAT smoke check | DONE |
| `GET /templates` | Template list | DONE |
| `GET /templates/{template_code}` | Template detail and versions | DONE |
| `GET /templates/{template_code}/versions` | Version list | DONE |
| `GET /templates/versions/{version_code}` | Version detail | DONE |
| `GET /templates/versions/{version_code}/axes` | Axis metadata | DONE |
| `GET /templates/versions/{version_code}/measures` | Measure metadata | DONE |
| `GET /templates/versions/{version_code}/cells` | Cell contract | DONE |
| `GET /templates/versions/{version_code}/render-elements` | Layout/render hints | DONE |
| `GET /templates/versions/{version_code}/validation-rule-refs` | Validation references | DONE |
| `GET /templates/versions/{version_code}/render-contract` | Assembled template render contract | DONE |

## Rules
- Data endpoints require bearer auth.
- Use `TEMPLATES:list` and `TEMPLATES:view` behavior from API.
- Current GET endpoints have no request body.
