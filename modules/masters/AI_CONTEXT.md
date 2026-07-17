# AI CONTEXT

## Module

Masters / Metadata UI

## Related Work Packets

- WP-2026-002: Master Metadata and i18n-Ready Schema Design
- WP-2026-012: Unit-Scoped Framework Edition Ownership

## Current Architecture

- UI implementation uses the approved React/Vite source-root exception: `ssd_ui/ui/src/`.
- Module traceability is maintained in `ssd_ui/modules/masters/`.
- Framework Management UI must support framework editions, hierarchy levels, nodes, and node relationships.
- DEC-2026-006 requires framework editions to be unit-owned.
- Super Admin must be able to select the active unit context from the top bar.
- Unit Admin and ordinary unit-scoped users should use the unit assigned through authentication/user role context and do not need a top-bar Unit dropdown by default.

## Unit Context Rule

| User Type | Unit Context Source | Top-Bar Unit Dropdown |
|---|---|---|
| Super Admin | Selected unit dropdown | Visible |
| Unit Admin | Authenticated user's mapped unit | Hidden |
| Unit-scoped officer/contributor | User/request assignment | Hidden |

## Framework Page Rules

- Framework page must load framework editions by selected or derived `unit_code`.
- Framework Edition form must include Unit selection for Super Admin.
- Active validation must be unit-scoped.
- The UI must not show stale framework hierarchy after selected unit changes.
- Framework child data remains scoped through the selected framework edition.

## AI Warnings

- Do not implement final API integration until WP-2026-012 DB and API contracts are ready.
- Do not expose internal `unit_id` in UI routes, forms, or API query construction.
- Do not treat active framework edition as global.
- Do not hardcode SDG-only framework behavior.
