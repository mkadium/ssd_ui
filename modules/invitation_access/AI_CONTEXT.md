# AI CONTEXT

## Module
Invitation Access UI

## Status
INVITATION_ACCESS_MONITOR_SAMPLE_DATA

## Current Understanding
- Database contract: `ssd_database/modules/invitation_access/DB_CONTRACTS.md`.
- Implementation root: `ssd_ui/ui/src/`.
- Context root: `ssd_ui/modules/invitation_access/`.
- Route implemented: `/invitation-access`.
- External setup route implemented: `/invitation-setup`.
- Current UI implementation: `ssd_ui/ui/src/pages/invitation-access/InvitationAccessPage.tsx`.
- Temporary contributor setup implementation: `ssd_ui/ui/src/pages/invitation-access/TemporaryContributorSetupPage.tsx`.
- Sample data: `ssd_ui/ui/src/data/invitationAccess.sample.ts`.
- Invitation records are generated from request/send or resend flow; the UI must not treat invitation access as a random manual invite master.
- Main page monitors request-linked contributor invitations.
- Clicking an invitation opens a detail/audit modal with access scope, delivery status, outbox metadata, and lifecycle events.
- Resend/revoke/copy-link actions are visual states only until governed APIs exist.
- Temporary contributor flow models request-linked account setup and scoped data entry without displaying or storing real setup tokens.

## Security Boundaries
- Do not expose `token_hash`.
- Do not display real raw setup tokens.
- Raw setup link may only be represented as available immediately after generation.
- Lost setup links require resend/supersede flow.
- Do not expose secrets, internal IDs, metadata JSON, token hashes, or sensitive full response bodies.
- `/invitation-setup` is intentionally outside the protected App Shell because it represents an external one-time setup URL; production access must be guarded by the API token/hash contract.
