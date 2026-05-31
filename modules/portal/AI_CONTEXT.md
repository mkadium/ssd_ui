# AI CONTEXT

## Module
Portal

---

# Current Architecture

- React + Vite + TypeScript + Tailwind UI scaffold exists under `ssd_ui/ui/`.
- Current implementation root is `ssd_ui/ui/src/`.
- Source folders currently present: `assets/`, `components/`, `hooks/`, `lib/`, `pages/`, `routes/`, `services/`, `stores/`, and `utils/`.
- `components/ui/` contains shadcn/ui-compatible shared UI primitives.
- Module context remains under `ssd_ui/modules/<module>/`; implementation files may live in shared `src` folders while retaining module traceability through context files.
- Auth API handoff is ready for UI planning/implementation; other first-demo module APIs remain pending.

---

# Existing Components

## Pages
- `ssd_ui/ui/src/pages/` scaffold folder exists; portal pages not yet implemented.

## Components
- `ssd_ui/ui/src/components/ui/button.tsx` exists.

## API Integrations
- None.

---

# Current Implementation Status

| Component | Status |
|---|---|
| React/Vite scaffold | STARTED |
| Source folder structure | STARTED |
| Public portal shell | PLANNED |
| Authenticated layout | PLANNED |
| Dashboard navigation | PLANNED |
| Bilingual support | PLANNED |
| Accessibility baseline | PLANNED |

---

# Important Development Notes

- Consume approved API contracts only.
- Keep public and authenticated UI flows clearly separated.
- Track accessibility and responsive behavior from the beginning.

---

# AI Warnings

- Auth endpoints may be consumed only from approved `ssd_api/modules/auth/API_CONTRACTS.md`.
- Do not assume non-auth first-demo API endpoints exist.
- Do not hardcode environment URLs or secrets.

