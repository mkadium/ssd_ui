# API USAGE

## Current State
- UI uses sample data only.
- Future API integration should consume request-linked invitation access endpoints when approved.

## Security Rules
- Never request or display `token_hash`.
- Never persist raw setup tokens or links in browser storage.
- Show raw setup URL only immediately after generation if a governed API returns it once.
- Use resend/supersede when setup link is lost or expired.
## 2026-06-04 UI Integration Update

- `InvitationAccessPage` now reads request-linked invitations from `GET /invitation-access/invitations?unit_code=SDG&locale=en-IN`.
- Invitation detail loads audit events from `GET /invitation-access/invitations/{invitation_code}/events?unit_code=SDG&locale=en-IN`.
- Resend, revoke, and one-time setup link generation call the governed endpoints:
  - `POST /invitation-access/invitations/{invitation_code}/generate-link`
  - `PATCH /invitation-access/invitations/{invitation_code}/notification-status`
  - `PATCH /invitation-access/invitations/{invitation_code}/revoke`
- Raw `setup_url` is held only in modal state after generation and cleared when the dialog closes.
- Token hashes, source hashes, raw payloads, and internal IDs are not displayed.
