# API USAGE

## Current State
- No API integration yet.
- Screen uses sample data shaped from deployment, API health, ingestion, validation, review, invitation, reminder/email, backup, and audit monitoring needs.

## Future API Needs
- `GET /monitor/health`
- `GET /monitor/jobs`
- `GET /monitor/audit-events`
- `GET /monitor/audit-events/{event_code}`

## Restrictions
- Monitor APIs must return sanitized summaries only.
- Full server logs, tokens, secrets, raw payloads, source hashes, and internal IDs must not be returned to UI.
