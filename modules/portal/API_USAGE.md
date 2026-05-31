# API USAGE

## Module
Portal

| API | UI Usage | Status |
|---|---|---|
| `GET /health` | Optional API availability check for DEV/UAT smoke validation | READY_FOR_AUTH_UI |
| `GET /auth/health` | Optional Auth module readiness check for DEV/UAT smoke validation | READY_FOR_AUTH_UI |
| `POST /auth/login` | Login flow handled by Auth UI module; portal consumes resulting authenticated state | READY_FOR_AUTH_UI |
| `GET /auth/me` | Load profile, roles, permissions, pages, and review levels for authenticated portal shell | READY_FOR_AUTH_UI |

## Rule

Do not consume APIs that are not documented in approved API contracts.

Auth API usage must not log raw tokens, passwords, password hashes, or response bodies containing secrets.

