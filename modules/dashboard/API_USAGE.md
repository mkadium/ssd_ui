# API USAGE

## Module
Dashboard UI

| API | UI Usage | Status |
|---|---|---|
| `GET /dashboard/health` | DEV/UAT smoke check | READY_FOR_UI_INTEGRATION |
| `GET /dashboard/overall-summary` | Top summary cards | READY_FOR_UI_INTEGRATION |
| `GET /dashboard/units` | Unit progress cards/tables | READY_FOR_UI_INTEGRATION |
| `GET /dashboard/goals` | Goal status charts/cards | READY_FOR_UI_INTEGRATION |
| `GET /dashboard/targets` | Target status charts/cards | READY_FOR_UI_INTEGRATION |
| `GET /dashboard/global-indicators` | Global indicator grouping | READY_FOR_UI_INTEGRATION |
| `GET /dashboard/national-indicators` | Indicator progress rows | READY_FOR_UI_INTEGRATION |
| `GET /dashboard/source-organizations` | Source organization progress | READY_FOR_UI_INTEGRATION |
| `GET /dashboard/review-queue` | Review queue summary | READY_FOR_UI_INTEGRATION |
| `GET /dashboard/drilldown` | Drilldown table rows | READY_FOR_UI_INTEGRATION |
| `GET /dashboard/pipeline-status` | Workflow/pipeline status | READY_FOR_UI_INTEGRATION |

## Rules
- Data endpoints require bearer auth and `DASHBOARD:view`.
- GET endpoints have no request body.
- Use direct `echarts` only for charts.
- Provide table/list fallback for chart data.
- Current Super Admin Dashboard uses local sample data only; live API integration is pending.
- Current Unit Admin Dashboard uses local sample data only; live API integration is pending.
- Current Submitted Snapshot Dashboard uses local sample data only; live API integration is pending.
## 2026-06-04 UI Integration Update

- `UnitAdminDashboardPage` now reads dashboard summary/list APIs with `unit_code=SDG&locale=en-IN`:
  - `GET /dashboard/overall-summary`
  - `GET /dashboard/goals`
  - `GET /dashboard/targets`
  - `GET /dashboard/national-indicators`
- `dashboardService` also exposes source-organization, drilldown, pipeline-status, approved-observations, and approved-summary endpoints for the next dashboard drilldown pass.
- `publishedDataService` exposes snapshot, latest-approved observation, and previous-approved staged-record lookup endpoints.
- Dashboard pages must show approved observations and summaries only through stable codes, never internal IDs, raw payloads, hashes, tokens, or metadata JSON.
