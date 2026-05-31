# DEPENDENCIES

| Dependency | Purpose | Status |
|---|---|---|
| `ssd_api/modules/review/API_CONTRACTS.md` | Review API contract | DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED |
| Validation API | Validation run/result context | READY |
| Ingestion API | Submission version context | READY |
| Auth UI/session | Bearer auth and permission-aware shell | PENDING_UI_IMPLEMENTATION |

## Risks
- Review action mutations are not available.
- `REVIEW:*` permissions are not seeded; API uses validation permissions for now.
