# DEPENDENCIES

| Dependency | Purpose | Status |
|---|---|---|
| `ssd_api/modules/dashboard/API_CONTRACTS.md` | Dashboard API contract | DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED |
| Auth UI/session | Bearer auth and permission-aware shell | PENDING_UI_IMPLEMENTATION |
| echarts | Dashboard/workflow charts | APPROVED_DIRECT_ONLY_IMPLEMENTED |
| react-router-dom | Dashboard route registration | APPROVED_IMPLEMENTED |
| `ssd_ui/ui/src/data/superAdminDashboard.sample.ts` | Sample data shaped like Dashboard API contract | TEMPORARY_UNTIL_API_INTEGRATION |

## Risks
- Dashboard chart content and final UX priorities still need validation with stakeholders.
- ECharts GIS/map/geo usage is not approved.
- Current dashboard data is sample-only and must not be treated as live evidence.
