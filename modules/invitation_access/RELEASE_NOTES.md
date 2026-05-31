# RELEASE NOTES

| Field | Value |
|---|---|
| Module | Invitation Access UI |
| Status | INVITATION_ACCESS_MONITOR_SAMPLE_DATA |
| Last Updated | 2026-05-31 |

## v0.1.0
- Added `/invitation-access` route.
- Added request-linked invitation monitor table.
- Added invitation detail/audit modal.
- Added metadata-only notification outbox view.
- Added visual-only resend, revoke, and copy-link action modals.
- Added `ssd_ui/ui/src/data/invitationAccess.sample.ts` with contract-shaped invitation records, audit events, and outbox sample data.
- Registered route behind authenticated route guard.
- Added `/invitation-setup` temporary contributor setup route outside the protected App Shell to model one-time setup URL behavior.
- Added scoped template preview and account setup UI without displaying real raw tokens or token hashes.
