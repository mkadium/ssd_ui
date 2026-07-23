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
- Applied the shared accessible loader to the Audit Sessions page.
- Modernized Review Workflow and Review Level drawers with structured sections, switch-style states, refined fields, and contextual footer actions.
- Applied the shared accessible loader to the Review Workflow page.
- Applied the shared accessible loader to the Unit Access page.
- Modernized the Create/Edit User drawer with grouped form sections, responsive access toggles, refined fields, and clearer footer actions.
- Applied the shared accessible loader to the User Administration page.
- Modernized Permission Matrix grant cards, section hierarchy, selection controls, responsive layout, spacing, and typography.
- Redesigned Role drawer boolean controls as modern, accessible toggle cards with clear supporting text and disabled states.
- Added a reusable accessible loader and applied it to the Permission Matrix data-loading state.
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

### Fixed
- Fixed Permission Matrix module cards collapsing inside the constrained scroll container by using intrinsic block flow.

### Testing
- `npm run lint` passed.
- `npm run build` passed.
