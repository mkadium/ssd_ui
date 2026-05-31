# DEPENDENCIES

# Internal Module Dependencies

| Module | Dependency Type | Purpose |
|---|---|---|
| `ssd_api/modules/auth` | REQUIRED | Approved Auth API contracts |
| `ssd_ui/modules/portal` | REQUIRED | Authenticated portal shell and navigation integration |

---

# API Dependencies

| API | Purpose | Status |
|---|---|---|
| `ssd_api/modules/auth/API_CONTRACTS.md` | Auth UI endpoint contracts | DEV_AUTH_EVIDENCE_CAPTURED |

---

# External Dependencies

| Service / Library | Purpose | Status |
|---|---|---|
| React + Vite + TypeScript + Tailwind | First-demo UI stack | APPROVED |
| react-router / react-router-dom | Routing and protected route handling | APPROVED |
| shadcn/ui | Form/control primitives with Tailwind | APPROVED_WITH_CONSTRAINTS |
| lucide-react | Icons | APPROVED |
| TanStack Query | API/server-state handling | APPROVED |
| React Hook Form | Form state | APPROVED |
| Zod | Form validation | APPROVED |
| echarts | Not needed for Auth; approved for dashboard/workflow charts only | APPROVED_NOT_USED |

---

# Dependency Risks

| Dependency | Risk |
|---|---|
| Local approved dependency installation | `node_modules` is currently missing approved packages, so build could not run until dependencies are installed |
| Token storage model | First-demo UI must avoid logging tokens and should minimize durable browser storage |
