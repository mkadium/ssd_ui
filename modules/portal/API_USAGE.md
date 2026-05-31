# API USAGE

## Module
Portal

| API | UI Usage | Status |
|---|---|---|
| `GET /health` | Optional API availability check for DEV/UAT smoke validation | READY_FOR_AUTH_UI |
| `GET /auth/health` | Optional Auth module readiness check for DEV/UAT smoke validation | READY_FOR_AUTH_UI |
| `POST /auth/login` | Login flow handled by Auth UI module; portal consumes resulting authenticated state | READY_FOR_AUTH_UI |
| `GET /auth/me` | Load profile, roles, permissions, pages, and review levels for authenticated portal shell | READY_FOR_AUTH_UI |
| `ssd_api/modules/masters/API_CONTRACTS.md` | Framework, indicator, organization, officer, periodicity, and source metadata screens | DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED |
| `ssd_api/modules/dimensions/API_CONTRACTS.md` | Dimension, member, geography, and time-period screens | DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED |
| `ssd_api/modules/templates/API_CONTRACTS.md` | Template list/detail/render-contract and template designer read foundation | DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED |
| `ssd_api/modules/requests/API_CONTRACTS.md` | Collection cycles, requests, items, assignments, and template instances | DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED |
| `ssd_api/modules/ingestion/API_CONTRACTS.md` | Submission readback and DEV-local JSON submit flow | DEV_LOCAL_SUBMIT_EVIDENCE_CAPTURED |
| `ssd_api/modules/validation/API_CONTRACTS.md` | Validation rules, runs, results, report, and comparison evidence | DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED |
| `ssd_api/modules/review/API_CONTRACTS.md` | Review status/action catalogs, tasks, actions, and approvals | DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED |
| `ssd_api/modules/dashboard/API_CONTRACTS.md` | Dashboard cards, summaries, queues, drilldowns, and pipeline status | DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED |

## Rule

Do not consume APIs that are not documented in approved API contracts.

Auth API usage must not log raw tokens, passwords, password hashes, or response bodies containing secrets.

Dashboard chart UI uses direct `echarts` only. Do not use wrappers, GIS/map/geo chart features, or unapproved visualization packages.

The first Super Admin Dashboard is sample-data only; live API integration is a separate implementation step.

The Login / Role Landing form is API-ready through the Auth service, but demo role buttons use sample Auth API-shaped data for local UI review. Unit Admin Dashboard is also sample-data only until Dashboard/API integration work starts.

Submitted Snapshot Dashboard is sample-data only until Dashboard API integration work starts.

Framework Edition Setup is sample-data only until Masters API integration work starts.

Indicator Management and Reference Masters are sample-data only until Masters API integration work starts.

Profile, Preferences, Reminders, and Notifications are sample-data only until governed profile/preference/notification APIs exist.

Future portal support API needs:
- Profile should consume Auth profile/session APIs such as `/auth/me`.
- Preferences need governed user-preference read/update APIs.
- Reminders need governed reminder list/detail/follow-up APIs.
- Notifications need governed notification list/detail/mark-read/archive APIs.

Portal support screens must not request or display raw access tokens, refresh tokens, password hashes, token hashes, raw payloads, source hashes, secrets, internal IDs, or sensitive full response bodies.
