# API USAGE

## Module
Ingestion UI

| API | UI Usage | Status |
|---|---|---|
| `GET /ingestion/health` | DEV/UAT smoke check | DONE |
| `GET /ingestion/submissions` | Submission list | DONE |
| `POST /ingestion/submissions` | DEV-local JSON submit | DONE_DEV_LOCAL |
| `GET /ingestion/submissions/{submission_code}` | Submission detail | DONE |
| `GET /ingestion/submissions/{submission_code}/versions` | Version list | DONE |
| `GET /ingestion/submissions/{submission_code}/events` | Event timeline | DONE |
| `GET /ingestion/versions/{version_code}` | Version detail | DONE |
| `GET /ingestion/versions/{version_code}/manifests` | Manifest list | DONE |
| `GET /ingestion/versions/{version_code}/jobs` | Job list | DONE |
| `GET /ingestion/versions/{version_code}/runs` | Run list | DONE |
| `GET /ingestion/versions/{version_code}/staged-records` | Staged records | DONE |
| `GET /ingestion/staged-records/{record_code}` | Staged record detail | DONE |
| `GET /ingestion/staged-records/{record_code}/dimensions` | Staged record dimensions | DONE |

## Rules
- Data endpoints require bearer auth.
- Submit uses `INGESTION:submit`.
- Submit accepts JSON payloads only in DEV-local phase.
- Do not display raw payload or sensitive hashes.
