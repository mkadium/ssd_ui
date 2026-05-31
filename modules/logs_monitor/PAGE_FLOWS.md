# PAGE FLOWS

## Primary Flow
1. Admin opens `/logs-monitor`.
2. Admin checks health summary cards.
3. Admin reviews component status across API, DB, storage, deployment, and scheduler.
4. Admin checks operations jobs for ingestion, validation, review, reminders/email, invitation expiry, and backup.
5. Admin searches or filters recent audit/log events.
6. Admin opens an event detail modal for sanitized evidence.

## Planned Future Flow
- Refresh should call a governed monitoring endpoint.
- Job rows may later link to detailed module pages.
- Backup/reminder/email records may later expose governed run history APIs.
