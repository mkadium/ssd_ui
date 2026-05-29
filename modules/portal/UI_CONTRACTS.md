# UI CONTRACTS

## Module
Portal

## Status

PLANNED

## UI Surfaces

| Surface | Purpose | Status |
|---|---|---|
| Public Portal | Public access to approved dashboard/publication features | PLANNED |
| Authenticated Portal | Internal SSD/MoSPI workflows gated by Auth UI state and API-enforced permissions | PLANNED |
| Shared App Scaffold | React/Vite `src` folders for pages, routes, services, stores, shared components, hooks, utilities, and assets | STARTED |

## Rules

- UI contracts must be updated before implementation begins.
- Public and authenticated access must be clearly separated.
- Accessibility and bilingual requirements must be tracked.
- UI hiding is not authorization; API permission checks remain authoritative.
- Implementation files under shared `ssd_ui/ui/src/` folders must be traceable to module context.

