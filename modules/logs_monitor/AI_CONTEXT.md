# AI CONTEXT

## Module
Logs & Monitor UI

## Status
LOGS_MONITOR_SAMPLE_DATA

## Current Understanding
- Route implemented: `/logs-monitor`.
- Current UI implementation: `ssd_ui/ui/src/pages/logs-monitor/LogsMonitorPage.tsx`.
- Sample data: `ssd_ui/ui/src/data/logsMonitor.sample.ts`.
- Screen monitors API health, DB connectivity, local file storage, DEV Docker deployment, scheduler readiness, operations jobs, reminder/email status, invitation expiry, backup status, and sanitized audit/log events.
- Recent audit/log rows are searchable and filterable by severity.
- Opening a log row shows a sanitized detail modal.

## Boundaries
- UI only.
- Do not modify API or database from this module.
- Do not display secrets, bearer tokens, token hashes, raw payloads, source hashes, internal database IDs, or full sensitive log bodies.
- Scheduler, reminder/email, backup, and refresh actions are visual/sample states until governed APIs exist.
