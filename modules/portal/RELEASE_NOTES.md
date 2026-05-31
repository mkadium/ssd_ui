# RELEASE NOTES

## Module Information

| Field | Value |
|---|---|
| Module | Portal |
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
- Initial UI portal module context created.
- Synced portal context with current React/Vite `src` folder scaffold.
- Recorded Auth API readiness impact for authenticated portal planning.
- Synced portal context with Auth through Dashboard API handoff readiness.
- Recorded ECharts approval for dashboard/workflow chart planning.
- Added authenticated App Shell and route setup.
- Added first Super Admin Dashboard screen at the 1366x768 baseline using contract-shaped sample data.
- Added Login / Role Landing route with guarded dashboard access.
- Added Unit Admin Dashboard route with goal, target, and indicator sample status trail.
- Added Submitted Snapshot Dashboard route with approved/published indicator and public-boundary sample data.
- Added Framework Edition Setup route with active edition, hierarchy browser, object relationship map, and indicator mapping readiness.
- Added Indicator Management route with selected-indicator related tabs for versions, metadata, global mapping, and multiple source assignments.
- Added Reference Masters route for locales, organizations, officers, periodicities, units, and measures.
- Added Dimension Management route with hierarchy, member sets, geography, and time-period sample-data workspace.
- Refined the authenticated shell, login screen, Framework Setup, Indicator Management, and Reference Masters toward the enterprise CRUD-first UX pattern.
- Added shared App Shell unit selector for authenticated operational pages, with Super Admin Dashboard kept as the global cross-unit exception.
- Added Profile route with safe account, unit, role, and session-summary data.
- Added Preferences route with language, dashboard, accessibility, reminder, and notification settings.
- Added Reminders route with searchable/filterable list and record-specific detail modal.
- Added Notifications route with searchable/filterable list and record-specific detail modal.
- Updated App Shell reminder/notification popovers and profile menu to navigate to full support pages.
- Added bilingual provider with persisted `en-IN`/`hi-IN` language selection for shell and common labels.
- Added Accessibility & GIGW Baseline route at `/accessibility-compliance`.
- Added DB/API Object Coverage route at `/system-object-coverage`.

### Enhancements
- Removed/replaced unapproved runtime dependencies from merged UI scaffold.
- Added governance reminder that UI screens must remain contract-driven, enterprise-grade, accessible, bilingual-ready, and aligned with GIGW 3.0 expectations.
- Added direct ECharts chart host for approved dashboard charts.
- Added bilingual-ready top bar controls and accessibility-oriented focus/semantic structure.
- Added dashboard selector navigation between Super Admin and Unit Admin dashboards.
- Extended dashboard selector navigation to Submitted Snapshot Dashboard.
- Added first Masters screen behind authenticated portal shell.
- Added second Masters screen behind authenticated portal shell.
- Added collapsible fixed sidebar, top-bar reminder/notification popovers, user menu/logout, and compact enterprise spacing.
- Centralized unit-scope selection in the App Shell instead of individual module pages.
- Added route-level lazy loading and dynamic ECharts module loading to remove the Vite large chunk warning.
- Added user experience sample data for profile, preferences, reminders, and notifications.
- Added accessibility evidence and module coverage matrices to reduce UI/API drift.

### Bug Fixes
- None.

### Refactoring
- Reduced rounded shared card styling and removed dashboard/search clutter from the shell.
- Simplified Login / Role Landing to avoid unnecessary page scroll at the 1366x768 baseline.
- Reworked Masters screens around searchable tables, selected-record details, hierarchy navigation, and modal action states.

### Security Improvements
- None.

### Performance Improvements
- Split route pages with React lazy loading.
- Split ECharts loading so chart modules load only when chart screens render.

### API Changes
- None.

### Dependencies Added
- `echarts` direct package usage for approved dashboard charts.
- `react-router-dom` for approved UI routing.

### Governance Notes
- Direct `echarts` usage is approved by DEC-2026-005.
- Existing merged package references to unapproved runtime libraries were removed or replaced.
- Build verification passed locally with approved dependencies installed.
- Lint verification passed locally after provider/context and ECharts registration cleanup.
- Previous Vite large chunk warning from chart/dashboard bundle size is resolved by route/chart code splitting.
- Demo role login uses placeholder sample data only and is not production authentication.
- Full page-body Hindi content remains a governed content expansion task; current bilingual implementation covers shell/common labels and document language.
