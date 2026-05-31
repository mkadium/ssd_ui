# UI CONTRACTS

## Invitation Access Monitor Contract
- `/invitation-access` must show request-linked invitation records generated from request/send or resend flow.
- Do not provide a primary random/manual invitation creation flow.
- Invitation monitor must show request code, item code, assignment code, organization, officer/contact, delivery channel, delivery status, invitation status, created/sent/opened/setup/revoked timestamps, and expiry.
- Clicking an invitation must open a detail/audit modal.
- Detail modal must show access scope, metadata-only notification outbox, audit events, and controlled visual actions.
- Resend, revoke, and copy one-time link actions are visual states only until governed APIs exist.
- Raw one-time setup link must be represented only as a placeholder and only when the current generation session indicates availability.
- Never expose `token_hash`, raw tokens, secrets, internal IDs, metadata JSON, or sensitive full response bodies.
