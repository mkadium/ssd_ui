# PAGE FLOWS

| Flow ID | Flow | Status |
|---|---|---|
| VALIDATION-FLOW-001 | Submitted item to validation report | PLANNED |
| VALIDATION-FLOW-002 | Validation report to result detail/comparison | PLANNED |
| VALIDATION-FLOW-003 | Validation blocked state back to data entry context | PLANNED |

## Implemented Validation Flow

1. Authenticated validation officer opens `/validation`.
2. User sees submitted request items in the validation queue.
3. User searches/filters by validation status, request, indicator, department, or officer.
4. User opens a validation queue row.
5. UI shows a report workspace with indicator context, goal/target path, submitted-by/to, result counts, template preview, validation result rows, selected result detail, and status trail.
6. User can open a template/cell drilldown modal from the selected validation result.
7. Back to data entry and continue to review are visual actions only until governed mutations are approved.
