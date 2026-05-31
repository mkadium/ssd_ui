# DEPENDENCIES

# Internal Module Dependencies

| Module | Dependency Type | Purpose |
|---|---|---|
| ssd_api/auth | REQUIRED | Authentication and authorization |
| ssd_api/dashboard | REQUIRED | Dashboard data |
| ssd_api/masters | REQUIRED | Framework, indicator, organization, officer, and source metadata |
| ssd_api/dimensions | REQUIRED | Dimension, geography, and time-period metadata |
| ssd_api/templates | REQUIRED | Template list, version, and render-contract metadata |
| ssd_api/requests | REQUIRED | Collection request and assignment context |
| ssd_api/ingestion | REQUIRED | Submission and staged data context |
| ssd_api/validation | REQUIRED | Validation result context |
| ssd_api/review | REQUIRED | Review task context |

---

# API Dependencies

| API | Purpose | Status |
|---|---|---|
| `ssd_api/modules/auth/API_CONTRACTS.md` | Login, current profile, logout, refresh, password management, permission check | DEV_AUTH_EVIDENCE_CAPTURED |
| `ssd_api/modules/masters/API_CONTRACTS.md` | Masters data | DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED |
| `ssd_api/modules/dimensions/API_CONTRACTS.md` | Dimensions data | DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED |
| `ssd_api/modules/templates/API_CONTRACTS.md` | Templates data | DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED |
| `ssd_api/modules/requests/API_CONTRACTS.md` | Requests data | DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED |
| `ssd_api/modules/ingestion/API_CONTRACTS.md` | Ingestion data and DEV-local submit | DEV_LOCAL_SUBMIT_EVIDENCE_CAPTURED |
| `ssd_api/modules/validation/API_CONTRACTS.md` | Validation data | DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED |
| `ssd_api/modules/review/API_CONTRACTS.md` | Review data | DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED |
| `ssd_api/modules/dashboard/API_CONTRACTS.md` | Dashboard data | DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED |

---

# External Dependencies

| Service | Purpose | Status |
|---|---|---|
| React + Vite + TypeScript + Tailwind | First-demo UI stack | APPROVED |
| react-router / react-router-dom | Routing | APPROVED |
| shadcn/ui | Component primitives | APPROVED_WITH_CONSTRAINTS |
| lucide-react | Icons | APPROVED |
| TanStack Query | API/server state | APPROVED |
| React Hook Form | Form state | APPROVED |
| Zod | Form validation | APPROVED |
| echarts | Dashboard/workflow charts | APPROVED direct package only |

---

# Dependency Risks

| Dependency | Risk |
|---|---|
| Dashboard bundle size | Vite reports a large production chunk after ECharts is included; optimize later if it affects UX |
| Mutation APIs are not generally implemented | UI must treat most modules as read-only until governed mutation API contracts exist |

---

# Dependency Lifecycle

| Dependency | Status |
|---|---|
| ssd_api/auth | DEV_AUTH_EVIDENCE_CAPTURED |
| ssd_api/dashboard | DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED |
| echarts | APPROVED_BY_DEC_2026_005_AND_IMPLEMENTED_DIRECTLY |
| react-router-dom | APPROVED_AND_IMPLEMENTED |
| Unapproved merged runtime dependencies | REMOVED_OR_REPLACED |
