# DEPENDENCIES

# Internal Module Dependencies

| Module | Dependency Type | Purpose |
|---|---|---|
| ssd_api/auth | REQUIRED | Authentication and authorization |
| ssd_api/dashboard | REQUIRED | Dashboard data |

---

# API Dependencies

| API | Purpose | Status |
|---|---|---|
| `ssd_api/modules/auth/API_CONTRACTS.md` | Login, current profile, logout, refresh, password management, permission check | DEV_AUTH_EVIDENCE_CAPTURED |
| Dashboard API contracts | Dashboard data | PENDING |

---

# External Dependencies

| Service | Purpose | Status |
|---|---|---|
| TBD | TBD | TBD |

---

# Dependency Risks

| Dependency | Risk |
|---|---|
| API contracts not finalized | UI implementation may change |

---

# Dependency Lifecycle

| Dependency | Status |
|---|---|
| ssd_api/auth | DEV_AUTH_EVIDENCE_CAPTURED |
| ssd_api/dashboard | PLANNED |

