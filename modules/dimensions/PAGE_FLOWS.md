# PAGE FLOWS

| Flow ID | Flow | Status |
|---|---|---|
| DIMENSIONS-FLOW-001 | Dimension list to member hierarchy browser | PLANNED |
| DIMENSIONS-FLOW-002 | Geography hierarchy inspection | PLANNED |
| DIMENSIONS-FLOW-003 | Time-period list/detail inspection | PLANNED |
| DIMENSIONS-FLOW-004 | Root/child member modal flows and bulk upload preview | IMPLEMENTED_SAMPLE_DATA |
| DIMENSIONS-FLOW-005 | Time-period and reporting-sequence administration | IMPLEMENTED_API_BACKED |

## Implemented Dimension Management Flow

1. Authenticated user opens `/dimensions`.
2. App Shell unit selector defines the working unit scope.
3. User selects a dimension definition such as GEOGRAPHY, TIME_PERIOD, AREA_TYPE, or GENDER.
4. Page shows member hierarchy tree with search across all levels and parent context retained for child matches.
5. User selects a member and sees detail, child count, dependency/usage, and row actions.
6. User can open visual modal states for New dimension, View, Edit, Add child, Create root, Delete, and Bulk upload.
7. New root member creation allows editable `dimension_code`; child creation inherits the selected parent dimension.
8. Tabs show Members, Member sets, Geography-specific records, and Time-period records from contract-shaped sample data.

## Implemented Time Periods Flow

1. Authenticated user opens `/dimensions/time-periods`.
2. Page loads frequencies, time periods, and `TIME_PERIOD` member sets from the Dimensions API.
3. User can filter/search periods by label, code, frequency, and status.
4. User can create or edit a governed time period through the right-side drawer form.
5. User can open Reporting Sequences and create ordered period sets for regular or irregular reporting needs.
6. Example supported sequences include two-year intervals such as `2020, 2022, 2024, 2026` and irregular intervals such as `2020, 2022, 2025, 2026`.
7. Reporting sequence items are stored as ordered `TIME_PERIOD` dimension member set items, so templates/requests can reference the sequence without hardcoding years.
8. Used reporting sequences are immutable. User copies an existing set as a new cycle/version, edits that new set, and leaves the historical set unchanged.
