# RELEASE NOTES

| Field | Value |
|---|---|
| Module | Ingestion UI |
| Status | INGESTION_READBACK_SAMPLE_DATA |
| Last Updated | 2026-05-31 |

## v0.1.0
- Created UI module context from ready Ingestion API contract.
- Added `/ingestion` route.
- Added ingestion readback table for submissions with versions, manifests, jobs, runs, and staged-record detail modal.
- Added `ssd_ui/ui/src/data/ingestionReadback.sample.ts` with contract-shaped ingestion lifecycle sample data.
- Preserved security boundary: raw payload bodies, source hashes, token values, token hashes, and internal IDs are not displayed.
