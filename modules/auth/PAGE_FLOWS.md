# PAGE FLOWS

## Module
Authentication UI

| Flow ID | Flow | Status |
|---|---|---|
| AUTH-FLOW-001 | User opens `/login`, submits login identifier, password, and optional unit id, then enters authenticated portal on successful `POST /auth/login` | PLANNED |
| AUTH-FLOW-002 | On app load or protected route entry, UI refreshes/validates session and loads profile through `GET /auth/me` | PLANNED |
| AUTH-FLOW-003 | Authenticated user signs out through `POST /auth/logout`, UI clears session state, and routes to `/login` | PLANNED |
| AUTH-FLOW-004 | Authenticated user changes password through `POST /auth/password/change` | PLANNED |
| AUTH-FLOW-005 | Authorized admin user with `AUTH:update` sets another active user's password through `POST /auth/admin/password/set` | OPTIONAL |
| AUTH-FLOW-006 | Authenticated portal navigation renders from API-returned permissions/pages | PLANNED |
