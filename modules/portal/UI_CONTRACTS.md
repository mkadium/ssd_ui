# UI CONTRACTS

## Module
Portal

## Status

STARTED

## UI Surfaces

| Surface | Purpose | Status |
|---|---|---|
| Public Portal | Public access to approved dashboard/publication features | PLANNED |
| Authenticated Portal | Internal SSD/MoSPI workflows gated by Auth UI state and API-enforced permissions | STARTED |
| Shared App Scaffold | React/Vite `src` folders for pages, routes, services, stores, shared components, hooks, utilities, and assets | STARTED |
| Super Admin Dashboard | First authenticated dashboard shell and sample-data dashboard surface | IMPLEMENTED_SAMPLE_DATA |
| Login / Role Landing | Auth entry screen with API login form and demo role workspace shortcuts | STARTED |
| Unit Admin Dashboard | Unit-level goal, target, and indicator trail dashboard | IMPLEMENTED_SAMPLE_DATA |
| Submitted Snapshot Dashboard | Approved/published indicator dashboard with public visibility boundary | IMPLEMENTED_SAMPLE_DATA |
| Framework Edition Setup | Read-only framework edition, hierarchy, and mapping readiness screen | IMPLEMENTED_SAMPLE_DATA |
| Indicator Management | Indicator-centric workspace for national/global indicator mappings, versions, metadata, and multiple source assignments | IMPLEMENTED_SAMPLE_DATA |
| Reference Masters | Reusable masters workspace for locales, organizations, officers, periodicities, units, and measures | IMPLEMENTED_SAMPLE_DATA |
| Dimension Management | Unit-scoped dimension definition, hierarchy, member set, geography, and time-period workspace | IMPLEMENTED_SAMPLE_DATA |
| Profile | Authenticated profile summary with user, role, unit, language, and safe session metadata | IMPLEMENTED_SAMPLE_DATA |
| Preferences | Personal language, dashboard, accessibility, reminder, and notification preference setup | IMPLEMENTED_SAMPLE_DATA |
| Reminders | Full reminder list with search/filter, status cards, and record-specific detail modal | IMPLEMENTED_SAMPLE_DATA |
| Notifications | Full notification list with search/filter, status cards, and record-specific detail modal | IMPLEMENTED_SAMPLE_DATA |

## Rules

- UI contracts must be updated before implementation begins.
- Public and authenticated access must be clearly separated.
- Accessibility and bilingual requirements must be tracked.
- UI hiding is not authorization; API permission checks remain authoritative.
- Implementation files under shared `ssd_ui/ui/src/` folders must be traceable to module context.
- Current dashboard data is sample-only and must not be treated as live API evidence.
- Demo role login is sample-only and must not be treated as production authentication.
- Public/snapshot dashboard screens must not expose protected review evidence, raw payloads, source hashes, tokens, secrets, metadata JSON, or internal IDs.
- Masters mutation behavior must remain disabled until governed mutation APIs are approved.
- Indicator Management and Reference Masters create/edit/delete/modal states must not send update requests until governed mutation APIs exist.
- Authenticated operational pages must expose a shared working-unit selector in the App Shell.
- Super Admin Dashboard is the only current authenticated exception because it is a cross-unit/global monitoring surface.
- Profile and preference pages must not expose raw auth tokens, refresh tokens, password hashes, or secret session data.
- Reminder and notification pages must show summarized workflow context only and must not expose raw payloads, source hashes, token hashes, secrets, internal IDs, or sensitive full response bodies.
