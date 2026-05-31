# UI CONTRACTS

## Logs & Monitor UI Contract
- `/logs-monitor` must render inside the standard `AppShell`.
- The page must show summary cards for system health, active jobs, audit events, and alerts.
- The page must show component health for API, database, local file storage, deployment, and scheduler.
- The page must show operations job status for ingestion, validation, review queue, reminder/email, invitation, and backup flows.
- The page must show a searchable audit/log table with severity filtering and visual pagination.
- Each audit/log record must open a sanitized detail modal.
- Refresh, pagination, and operational actions are visual only until governed monitor APIs exist.

## Sensitive Data Rules
- Never show real secrets, tokens, token hashes, raw payloads, source hashes, internal IDs, or full log bodies.
- Log detail content must remain summarized and sanitized.
