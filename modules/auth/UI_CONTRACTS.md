# UI CONTRACTS

## Module
Authentication UI

## Status

STARTED

## UI Surfaces

| Surface | Purpose | Status |
|---|---|---|
| Login | Collect login identifier, password, and optional unit id | STARTED |
| Auth Session Provider | Maintain authenticated user/session state for the React app | STARTED |
| Protected Routes | Gate authenticated routes and load current profile | STARTED |
| Permission Navigation | Render navigation from API-returned permissions/pages | PLANNED |
| Logout | End API session and clear UI-held session state | PLANNED |
| Change Password | Let current bearer-token user change password | PLANNED |
| Admin Set Password | Allow authorized admin users with `AUTH:update` to set an active user's password | OPTIONAL |

## Rules

- Login request body contains only `login_identifier`, `password`, and optional `unit_id`.
- Auth responses may include tokens, profile, roles, permissions, pages, and review levels.
- Raw tokens, passwords, password hashes, and secret-bearing response bodies must not be logged.
- Permission-based UI hiding is only a usability layer; API authorization is authoritative.
- Admin set-password UI must be visible only when UI state includes `AUTH:update`, and API still enforces authorization.
- Demo role login is for local UI review only and must be replaced by real Auth API session behavior before production use.
