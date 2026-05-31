# RELEASE NOTES

## Module Information

| Field | Value |
|---|---|
| Module | Authentication UI |
| Team | UI |
| Current Version | v0.1.0 |
| Status | STARTED |
| Last Updated By | UI Team |
| Last Updated Date | 2026-05-31 |
| Jira Tickets | TBD |

---

# Latest Release

## v0.1.0

### New Features
- Created Auth UI module context from completed Auth API handoff.
- Documented planned login, session, protected route, profile loading, permission navigation, logout, and password-management UI flows.
- Synced Auth UI context after `dev` was merged into `mohan`.
- Replaced unapproved Auth scaffold dependencies with native `fetch` and React Context patterns.
- Implemented Login / Role Landing screen.
- Implemented `ProtectedRoute` for authenticated dashboard routes.
- Added sample Auth API-shaped Super Admin and Unit Admin demo profiles for UI review only.
- Refined Login / Role Landing into a compact enterprise screen without unnecessary page scroll at the 1366x768 baseline.
- Added authenticated shell logout behavior that clears in-memory Auth state and routes to `/login`.
- Added `/password-management` route for current-user password change and admin set-password visual workflows.
- Linked Profile page Change password action to the Password Management route.

### API Changes
- None in UI; consumes `ssd_api/modules/auth/API_CONTRACTS.md`.

### Dependencies Added
- None.

### Governance Notes
- Existing merged Auth code no longer references unapproved `axios` or `zustand`.
- Password UI follows approved Auth API contracts and does not store/log raw passwords.

### Testing
- `npm run lint` passed.
- `npm run build` passed.
