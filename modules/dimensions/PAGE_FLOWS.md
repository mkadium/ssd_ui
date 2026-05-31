# PAGE FLOWS

| Flow ID | Flow | Status |
|---|---|---|
| DIMENSIONS-FLOW-001 | Dimension list to member hierarchy browser | PLANNED |
| DIMENSIONS-FLOW-002 | Geography hierarchy inspection | PLANNED |
| DIMENSIONS-FLOW-003 | Time-period list/detail inspection | PLANNED |
| DIMENSIONS-FLOW-004 | Root/child member modal flows and bulk upload preview | IMPLEMENTED_SAMPLE_DATA |

## Implemented Dimension Management Flow

1. Authenticated user opens `/dimensions`.
2. App Shell unit selector defines the working unit scope.
3. User selects a dimension definition such as GEOGRAPHY, TIME_PERIOD, AREA_TYPE, or GENDER.
4. Page shows member hierarchy tree with search across all levels and parent context retained for child matches.
5. User selects a member and sees detail, child count, dependency/usage, and row actions.
6. User can open visual modal states for New dimension, View, Edit, Add child, Create root, Delete, and Bulk upload.
7. New root member creation allows editable `dimension_code`; child creation inherits the selected parent dimension.
8. Tabs show Members, Member sets, Geography-specific records, and Time-period records from contract-shaped sample data.
