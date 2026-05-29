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
- None implemented yet.

## Components
- Shared UI primitive `ssd_ui/ui/src/components/ui/button.tsx` exists.

## API Integrations
- None implemented yet.

---

# Current Implementation Status

| Component | Status |
|---|---|
| Auth UI context | STARTED |
| Login screen | PLANNED |
| Auth session provider/state | PLANNED |
| Protected route handling | PLANNED |
| `/auth/me` profile loading | PLANNED |
| Permission/page-driven navigation support | PLANNED |
| Logout flow | PLANNED |
| Change-password screen | PLANNED |
| Admin set-password screen | OPTIONAL |

---

# Important Development Notes

- Consume only approved Auth API contracts.
- Do not store or print raw tokens in logs.
- Do not expose password hashes.
- UI hiding is not authorization; API enforces permissions server-side.
- Do not implement non-auth first-demo module screens until their API contracts are ready.

---

# AI Warnings

- Do not hardcode permissions outside the API contract.
- Do not hardcode environment URLs or secrets.
- Do not add unapproved UI dependencies.
