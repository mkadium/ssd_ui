# PAGE FLOWS

| Flow ID | Flow | Status |
|---|---|---|
| REQUESTS-FLOW-001 | Cycle list to request list | PLANNED |
| REQUESTS-FLOW-002 | Request detail to item/template instance | PLANNED |
| REQUESTS-FLOW-003 | Request assignment and status trail view | PLANNED |

## Implemented Collection Request Flow

1. Authenticated user opens `/requests`.
2. App Shell unit selector defines working unit scope.
3. User selects a collection cycle and sees request counts, due/follow-up status, and assignment summary.
4. Requests tab supports search, status filtering, detail, scope preview, send-confirm visual state, and follow-up visual state.
5. Create request tab guides cycle -> source organization/officer -> indicator -> template -> time/scope -> assignments.
6. Items & scope tab shows request items, selected template version, and governed dimension scope members.
7. Assignments tab shows provider/owner/observer assignment metadata.
8. Status trail tab connects request, data entry, ingestion, validation, review, and dashboard context without exposing internal IDs or raw tokens.
