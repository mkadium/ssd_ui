# API USAGE

## Module
Authentication UI

| API | UI Usage | Status |
|---|---|---|
| `GET /health` | Optional DEV/UAT API smoke check | READY |
| `GET /auth/health` | Optional Auth module smoke check | READY |
| `POST /auth/login` | Submit login identifier, password, and optional unit id; receive session/profile payload | READY |
| `POST /auth/refresh` | Refresh access token from refresh token when session reload/renewal is needed | READY |
| `POST /auth/logout` | End the current bearer-token session | READY |
| `GET /auth/me` | Load current profile, roles, permissions, pages, and review levels | READY |
| `POST /auth/permissions/check` | Check current bearer-token user's permission by permission code and optional unit | READY |
| `POST /auth/password/change` | Current-user password change after current password verification | READY |
| `POST /auth/admin/password/set` | Admin set-password action for users authorized with `AUTH:update` | READY |

## Rules

- Use bearer auth only after successful login/refresh.
- Do not store or print raw tokens in logs.
- Do not log password values or password-management request bodies.
- Do not expose password hashes.
- Do not assume permission behavior beyond returned permissions/pages and approved API contracts.
