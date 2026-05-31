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
- Auth through Dashboard API handoff evidence is captured for UI planning/implementation.
- Current ready API modules for UI consumption are Auth, Masters, Dimensions, Templates, Requests, Ingestion, Validation, Review, and Dashboard.
- Invitation Access remains DB contract ready only on API side; UI sample monitoring and temporary contributor setup surfaces now exist.

---

# Existing Components

## Pages
- `ssd_ui/ui/src/pages/dashboard/SuperAdminDashboardPage.tsx` implements the first dashboard screen using sample data shaped like the Dashboard API contract.
- `ssd_ui/ui/src/pages/auth/LoginPage.tsx` implements Login / Role Landing.
- `ssd_ui/ui/src/pages/dashboard/UnitAdminDashboardPage.tsx` implements Unit Admin Dashboard using sample data shaped like Dashboard and downstream module contracts.
- `ssd_ui/ui/src/pages/dashboard/SubmittedSnapshotDashboardPage.tsx` implements the approved/published snapshot dashboard using sample data shaped like the Dashboard API contract.
- `ssd_ui/ui/src/pages/masters/FrameworkEditionSetupPage.tsx` implements Framework Edition Setup using sample data shaped like the Masters API contract.
- `ssd_ui/ui/src/pages/masters/IndicatorManagementPage.tsx` implements Indicator Management using sample data shaped like the Masters DB/API contract.
- `ssd_ui/ui/src/pages/masters/ReferenceMastersPage.tsx` implements Reference Masters using sample data shaped like the Masters DB/API contract.
- `ssd_ui/ui/src/pages/dimensions/DimensionsManagementPage.tsx` implements Dimension Management using sample data shaped like the Dimensions DB/API contract.
- `ssd_ui/ui/src/pages/portal/ProfilePage.tsx` implements the authenticated profile summary page.
- `ssd_ui/ui/src/pages/portal/PreferencesPage.tsx` implements personal preference setup with visual-only save/reset actions.
- `ssd_ui/ui/src/pages/portal/RemindersPage.tsx` implements full reminder list/detail views.
- `ssd_ui/ui/src/pages/portal/NotificationsPage.tsx` implements full notification list/detail views.
- `ssd_ui/ui/src/pages/portal/AccessibilityCompliancePage.tsx` implements the GIGW/accessibility baseline evidence screen.
- `ssd_ui/ui/src/pages/portal/SystemObjectCoveragePage.tsx` implements the DB/API object coverage matrix.

## Components
- `ssd_ui/ui/src/components/ui/button.tsx` exists.
- `ssd_ui/ui/src/components/layout/AppShell.tsx` implements the authenticated enterprise shell with sidebar, top bar, dashboard selector, shared unit selector, language selector, reminders, notifications, tour, and admin controls.
- App Shell now includes a collapsible fixed sidebar, shared unit scope selector for all working pages except Super Admin Dashboard, top-bar reminder/notification popovers with full-page links, user menu links to Profile/Preferences, logout, and compact enterprise spacing.
- `ssd_ui/ui/src/components/charts/EChart.tsx` wraps direct `echarts` usage without an unapproved React chart wrapper.
- Route pages use React lazy loading and `EChart` dynamically loads approved direct ECharts modules to keep initial bundles smaller.
- `ssd_ui/ui/src/components/auth/ProtectedRoute.tsx` gates authenticated routes.

## API Integrations
- None yet. The first dashboard uses local sample data in `ssd_ui/ui/src/data/superAdminDashboard.sample.ts` until API integration starts.

---

# Current Implementation Status

| Component | Status |
|---|---|
| React/Vite scaffold | STARTED |
| Source folder structure | STARTED |
| Public portal shell | PLANNED |
| Authenticated layout | STARTED |
| Dashboard navigation | STARTED |
| API-driven module navigation | PLANNED |
| ECharts dashboard chart usage | STARTED_DIRECT_USAGE |
| Bilingual support | ARCHITECTURE_READY |
| Accessibility baseline | STARTED |
| Super Admin dashboard route | IMPLEMENTED_SAMPLE_DATA |
| Login / Role Landing route | IMPLEMENTED_SAMPLE_AND_API_READY |
| Unit Admin dashboard route | IMPLEMENTED_SAMPLE_DATA |
| Submitted Snapshot dashboard route | IMPLEMENTED_SAMPLE_DATA |
| Framework Edition Setup route | IMPLEMENTED_SAMPLE_DATA |
| Indicator Management route | IMPLEMENTED_SAMPLE_DATA |
| Reference Masters route | IMPLEMENTED_SAMPLE_DATA |
| Dimension Management route | IMPLEMENTED_SAMPLE_DATA |
| Profile route | IMPLEMENTED_SAMPLE_DATA |
| Preferences route | IMPLEMENTED_SAMPLE_DATA |
| Reminders route | IMPLEMENTED_SAMPLE_DATA |
| Notifications route | IMPLEMENTED_SAMPLE_DATA |
| Bilingual provider | IMPLEMENTED_SHELL_AND_COMMON_LABELS |
| Accessibility/GIGW evidence route | IMPLEMENTED_SAMPLE_DATA |
| DB/API object coverage route | IMPLEMENTED_SAMPLE_DATA |
| Enterprise shell/login/master UX cleanup | DONE_SAMPLE_DATA |

---

# Important Development Notes

- Consume approved API contracts only.
- Keep public and authenticated UI flows clearly separated.
- Track accessibility and responsive behavior from the beginning.

---

# AI Warnings

- UI must consume only approved API contracts from `ssd_api/modules/<module>/API_CONTRACTS.md`.
- Non-auth first-demo API endpoints exist for read-only foundations and documented ingestion submit only; mutation CRUD is not generally available.
- `echarts` is approved for charts only as direct package usage; no wrapper or GIS/map/geo chart usage.
- Existing merged unapproved runtime dependencies were removed or replaced during UI dependency cleanup.
- Shared primitives are intentionally lean until each enterprise screen pattern is implemented against real DB/API contracts.
- Do not hardcode environment URLs or secrets.
- Future UI screens must match acceptance criteria, module scope, database objects, API contracts, GIGW 3.0/accessibility expectations, bilingual readiness, and the approved enterprise UX direction from Penpot.
- Super Admin Dashboard is implemented with representative sample data only; API wiring must be explicit future work and must keep Dashboard schema read-only.
- Unit Admin Dashboard and demo role login are also sample-data foundations; production integration must use approved Auth/Dashboard/API contracts.
- Snapshot/public dashboard data must remain approved/published only; do not expose protected review evidence or raw submissions.
- Framework Edition Setup is read-only/sample-data until Masters API integration and governed mutation APIs exist.
- Indicator Management and Reference Masters modal actions are UI previews only until Masters mutation APIs are approved.
- Enterprise screen direction: use CRUD-first tables, row actions, modal forms, search/filter/sort/pagination patterns, selected-record panels, fixed/collapsible navigation, localized labels, keyboard focus states, and minimal page copy.
- All authenticated operational pages are unit-scoped through the shared App Shell unit selector; Super Admin Dashboard remains the global cross-unit exception.
- Profile, Preferences, Reminders, and Notifications are portal support surfaces using sample data only.
- Reminder and notification follow-up/mark-read actions are visual-only until governed user-preference/notification APIs exist.
- Bilingual behavior is implemented through a provider that persists `en-IN`/`hi-IN`, updates the document language, and translates shell/common labels. Page-body Hindi copy expansion remains a governed content task.
- Accessibility/GIGW route records implemented baseline evidence and remaining formal audit/testing work.
- Object coverage route maps Auth through Invitation Access DB/API objects to current UI routes and boundaries.
