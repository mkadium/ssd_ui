# UI Boundaries

Purpose:

Defines UI team ownership.

## UI Team Owns

- Unified portal UI
- Actual UI implementation under `ssd_ui/ui/`
- Current Vite app implementation under `ssd_ui/ui/src/`
- Dashboard UI
- CMS UI
- Admin UI
- Document management UI
- Virtual book UI
- Report UI
- GIS/map visualization UI
- Responsive behavior
- Accessibility implementation evidence
- UI module context files
- UI module context under `ssd_ui/modules/`

## Folder Boundaries

- `ssd_ui/ui/` is for actual UI implementation code.
- `ssd_ui/ui/src/` is the current React/Vite implementation root.
- Module traceability is maintained through `ssd_ui/modules/<module>/` context files when implementation uses shared `src` folders.
- `ssd_ui/modules/` is for context, UI contracts, page flows, component maps, API usage, release notes, dependencies, pending tasks, versions, known issues, and ownership.
- `ssd_ui/.init/` is for AI bootstrap and team operating rules.
- Do not place implementation code in `.init/` or `modules/`.
- Do not create `ssd_ui/ui/modules/<module>/`.

## UI Team Must Not Own

- Database schema implementation
- API business logic implementation
- Testing framework ownership
- Central governance policies
- Production deployment mutation

## Escalation Required

- API contract mismatch
- Accessibility/GIGW/STQC compliance risk
- Authentication/session UI changes
- Public data exposure risk
- Release-blocking UI gap
