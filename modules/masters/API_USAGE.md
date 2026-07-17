# API USAGE

## Module

Masters / Metadata UI

## Unit-Scoped Framework APIs

WP-2026-011 requires Masters framework APIs to support public stable `unit_code`.

Expected API usage after API handoff:

```text
GET /masters/framework-editions?unit_code=SDG&include_inactive=true&locale=en-IN
POST /masters/framework-editions?locale=en-IN
PATCH /masters/framework-editions/{framework_code}/{edition_code}?unit_code=SDG&locale=en-IN
DELETE /masters/framework-editions/{framework_code}/{edition_code}?unit_code=SDG&locale=en-IN
POST /masters/framework-editions/{framework_code}/{edition_code}/restore?unit_code=SDG&locale=en-IN
GET /masters/frameworks/{framework_code}/hierarchy?unit_code=SDG&locale=en-IN
```

Create/update body must include `unit_code` until API confirms a token-derived alternative for Unit Admin mutation flows.

```json
{
  "unit_code": "SDG",
  "framework_code": "SDG_NIF",
  "edition_code": "SDG_NIF_2025",
  "name": "SDG NIF 2025",
  "version_label": "2025",
  "status": "ACTIVE",
  "is_active": true
}
```

## UI API Rules

- Super Admin requests must pass the selected top-bar `unit_code`.
- Unit Admin requests should use the authenticated user's mapped unit once API supports derived-unit context.
- UI must never pass internal `unit_id`.
- UI must refresh Framework page data after unit switch.
- UI must handle 400/404/409/422 errors with safe production messages.

