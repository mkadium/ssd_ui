# AI CONTEXT

## Module
Authentication UI

---

# Current Architecture

- Auth API is marked `DEV_AUTH_EVIDENCE_CAPTURED`.
- UI may begin Auth integration planning and implementation after approved `Implement:` command.
- Current React/Vite implementation root is `ssd_ui/ui/src/`.
- Auth implementation should use existing shared folders: `pages/`, `routes/`, `services/`, `hooks/`, `stores/`, `components/`, and `utils/`.
- Auth UI context and contracts live under `ssd_ui/modules/auth/`.

---

# Existing Components

## Pages
- `ssd_ui/ui/src/pages/auth/LoginPage.tsx` implements the first login / role landing screen.

## Components
- `ssd_ui/ui/src/components/auth/ProtectedRoute.tsx` gates authenticated routes.
- Shared UI primitives are used for buttons, cards, inputs, and badges.

## API Integrations
- None implemented yet.

---

# Current Implementation Status

| Component | Status |
|---|---|
| Auth UI context | STARTED |
| Login screen | IMPLEMENTED_SAMPLE_AND_API_READY |
| Auth API service hooks from merged scaffold | STARTED_GOVERNANCE_ALIGNED |
| Auth session provider/state | STARTED_REACT_CONTEXT |
| Protected route handling | STARTED |
| `/auth/me` profile loading | PLANNED |
| Permission/page-driven navigation support | PLANNED |
| Logout flow | STARTED_IN_MEMORY |
| Change-password screen | IMPLEMENTED_SAMPLE_AND_API_READY |
| Admin set-password screen | IMPLEMENTED_SAMPLE_AND_API_READY |

---

# Important Development Notes

- Consume only approved Auth API contracts.
- Do not store or print raw tokens in logs.
- Do not expose password hashes.
- UI hiding is not authorization; API enforces permissions server-side.
- Auth through Dashboard API contracts are ready for UI planning, but module implementation must still follow approved prompts and module context.
- Auth API calls now use native `fetch`.
- Auth state now uses React Context and in-memory token state; persistent browser token storage is not implemented.
- Login form can call the approved Auth API when `VITE_API_URL` is configured.
- Demo role buttons use sample `LoginResponse`-shaped data only for UI review; demo tokens are placeholders and not real credentials.
- Login / Role Landing was compacted for the 1366x768 baseline; authenticated shell logout clears in-memory Auth state and returns to `/login`.
- Password Management route is implemented at `/password-management` with current-user change password and admin set-password UI shaped from approved Auth API contracts.
- Password fields remain client-side form controls only in the sample UI; API integration must not log or persist raw passwords.

---

# AI Warnings

- Do not hardcode permissions outside the API contract.
- Do not hardcode environment URLs or secrets.
- Do not add unapproved UI dependencies.
- Future UI screens must match the active work packet, DB/API contracts, acceptance criteria, GIGW 3.0/accessibility expectations, bilingual readiness, and the enterprise UX patterns designed in Penpot.
