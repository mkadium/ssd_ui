# KNOWN ISSUES

# Active Issues

| Issue ID | Description | Severity | Status |
|---|---|---|---|
| UI-PORTAL-001 | UI context was stale after API handoff; Auth through Dashboard API contracts are now ready for UI planning | MEDIUM | CLOSED |
| UI-PORTAL-002 | Portal routes and pages are now started with App Shell and Super Admin Dashboard; remaining flows are pending | MEDIUM | OPEN |
| UI-PORTAL-003 | Existing merged UI package set included dependencies not approved by governance | HIGH | CLOSED |
| UI-PORTAL-004 | Local approved dependencies are installed and build verification passed | MEDIUM | CLOSED |
| UI-PORTAL-005 | Current first dashboard uses sample data only; live API integration is pending | MEDIUM | OPEN |
| UI-PORTAL-006 | Vite large chunk warning from dashboard/ECharts bundle size | LOW | CLOSED |

---

# Technical Limitations

- UI source folder scaffold exists, and the first portal shell/dashboard route is implemented.
- Auth through Dashboard API foundations are ready, but most mutation CRUD remains out of scope.
- Current merged implementation no longer references the removed unapproved runtime packages.
- Build verification passed after approved dependencies were installed locally.
- Build verification now passes without the previous ECharts large chunk warning after route/chart code splitting.

---

# AI Warnings

- Do not implement endpoint-specific UI behavior outside approved API contracts.
- Auth UI behavior may consume only approved Auth API contracts.
- Do not reintroduce unapproved libraries just because templates or component generators suggest them.
