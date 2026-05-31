# AI CONTEXT

## Module
Ingestion UI

## Status
INGESTION_READBACK_SAMPLE_DATA

## Current Understanding
- API contract: `ssd_api/modules/ingestion/API_CONTRACTS.md`.
- API evidence: `DEV_LOCAL_SUBMIT_EVIDENCE_CAPTURED`.
- Implementation root: `ssd_ui/ui/src/`.
- Context root: `ssd_ui/modules/ingestion/`.
- API supports read endpoints and DEV-local JSON submit.
- Route implemented: `/ingestion`.
- Current UI implementation: `ssd_ui/ui/src/pages/ingestion/IngestionReadbackPage.tsx`.
- Sample data: `ssd_ui/ui/src/data/ingestionReadback.sample.ts`.
- Main page shows submission lifecycle records; detail modal shows versions, manifests, jobs, runs, and staged records.

## Scope
- Submission queue/detail, versions, events, manifests, jobs, runs, staged records, and DEV-local submit.
- Do not expose raw payload bodies, token values, token hashes, source hashes, or internal metadata.
- Object storage remains deferred.
- Ingestion admin/readback screen is read-only/sample-data until API integration starts.
