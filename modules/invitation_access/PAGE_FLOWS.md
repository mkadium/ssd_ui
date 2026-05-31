# PAGE FLOWS

## INVITATION-ACCESS-FLOW-001
1. Request admin opens `/invitation-access`.
2. UI lists request-linked contributor invitations generated from request send/resend.
3. User searches/filters by request, assignment, officer/contact, or invitation status.
4. User opens one invitation record.
5. UI shows request/item/assignment access scope, officer/contact, delivery metadata, expiry, lifecycle status, outbox record, and audit events.
6. User can open visual-only resend, revoke, or copy-link modal states.
7. Copy-link is disabled when the one-time link is not available in the current generation session.

## UX Rule
Invitation access is a monitor/control surface, not a master-entry screen. Random invitations are out of scope.
