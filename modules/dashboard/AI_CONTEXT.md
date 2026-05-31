# AI CONTEXT

## Module
Dashboard UI

## Status
SUPER_ADMIN_DASHBOARD_IMPLEMENTED_SAMPLE_DATA

## Current Understanding
- API contract: `ssd_api/modules/dashboard/API_CONTRACTS.md`.
- API evidence: `DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED`.
- Implementation root: `ssd_ui/ui/src/`.
- Context root: `ssd_ui/modules/dashboard/`.
- Dashboard schema is read-only.
- Direct `echarts` usage is approved by DEC-2026-005.
- First UI foundation screen implemented: `ssd_ui/ui/src/pages/dashboard/SuperAdminDashboardPage.tsx`.
- Unit Admin Dashboard implemented: `ssd_ui/ui/src/pages/dashboard/UnitAdminDashboardPage.tsx`.
- Submitted Snapshot Dashboard implemented: `ssd_ui/ui/src/pages/dashboard/SubmittedSnapshotDashboardPage.tsx`.
- Route implemented: `/dashboard/super-admin`.
- Route implemented: `/dashboard/unit-admin`.
- Route implemented: `/dashboard/snapshot`.
- Current screen uses contract-shaped sample data from `ssd_ui/ui/src/data/superAdminDashboard.sample.ts`; no live Dashboard API calls yet.
- Unit screen uses contract-shaped sample data from `ssd_ui/ui/src/data/unitAdminDashboard.sample.ts`.
- Snapshot screen uses contract-shaped sample data from `ssd_ui/ui/src/data/submittedSnapshotDashboard.sample.ts`.

## Scope
- Overall summary, units, goals, targets, global indicators, national indicators, source organizations, review queue, drilldown, and pipeline status.
- Super Admin, Unit Admin, and submitted snapshot dashboards may be planned from these endpoints.
- Do not write to dashboard schema or implement dashboard mutations.

## Warnings
- Use direct `echarts` only; no wrappers and no GIS/map/geo usage.
- Dashboard endpoints require `DASHBOARD:view`.
- Do not treat sample dashboard counts as production data.
- When API integration starts, continue using the Dashboard API read-only boundary and do not write to dashboard schema.
- Submitted Snapshot Dashboard must show approved/published data only and must not expose internal review evidence, raw payloads, source hashes, metadata JSON, or internal IDs.
