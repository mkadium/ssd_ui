# COMPONENT MAP

| Area | Purpose | Status |
|---|---|---|
| `src/pages/dashboard/SuperAdminDashboardPage.tsx` | Super Admin dashboard overview, workflow path, stats, charts, tables, and drilldown panel | IMPLEMENTED_SAMPLE_DATA |
| `src/pages/dashboard/UnitAdminDashboardPage.tsx` | Unit Admin goal, target, indicator trail dashboard with chart/table summaries | IMPLEMENTED_SAMPLE_DATA |
| `src/pages/dashboard/SubmittedSnapshotDashboardPage.tsx` | Approved/published indicator snapshot dashboard with public readiness boundary | IMPLEMENTED_SAMPLE_DATA |
| `src/App.tsx` | Route registration for `/dashboard/super-admin`, `/dashboard/unit-admin`, `/dashboard/snapshot`, `/login`, and guarded fallbacks | IMPLEMENTED |
| `src/services/` | Dashboard API service functions | PLANNED |
| `src/hooks/` | Dashboard query hooks | PLANNED |
| `src/components/layout/AppShell.tsx` | Shared authenticated shell used by dashboard pages | IMPLEMENTED |
| `src/components/charts/EChart.tsx` | Direct ECharts host; no unapproved chart wrapper | IMPLEMENTED |
| `src/data/superAdminDashboard.sample.ts` | Sample data shaped like Dashboard API summaries, pipeline status, review queue, and drilldown rows | IMPLEMENTED |
| `src/data/unitAdminDashboard.sample.ts` | Sample data shaped for unit goal, target, and indicator dashboard views | IMPLEMENTED |
| `src/data/submittedSnapshotDashboard.sample.ts` | Sample data shaped for approved/published snapshot dashboard views | IMPLEMENTED |
| `src/components/ui/` | Cards/buttons/forms/tables used by dashboard composition | STARTED |
