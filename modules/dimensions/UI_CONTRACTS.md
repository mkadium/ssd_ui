# UI CONTRACTS

## Dimensions UI Contract
- Dimension Library uses live `/dimensions` API contracts.
- Hierarchy browsers must use API stable codes and parent-child relationships.
- `/dimensions/library` is implemented as the primary Dimensions UI page.
- Screen must use a Framework-style single workflow card with ordered tabs: Dimensions, Members, Hierarchy, Member Sets, Rollups, Aliases.
- The Dimensions tab must expose KPI cards, search, structure/usage/status filters, and a full-width management table.
- Selecting a dimension row sets the active dimension context for subsequent tabs.
- Subsequent tabs must show only data for the selected dimension and use right-side drawer forms for create/edit actions.
- Screen must expose DB v0.2 rollup rules where available: parent member, children, entry mode, aggregation method, measure code, validation rule, and status.
- Rollup UI must explain that rollups configure parent-member validation/aggregation behavior only; a formula engine is future governed scope.
- Dimension definition selection includes search/filter and stat cards must summarize definition, hierarchy, member-set, and dependency context.
- Screen must expose create/update actions only through governed API endpoints.
- Bulk upload/import/export must not be shown as live behavior until approved and API-backed.
- Geography remains managed through Dimension Library tabs unless governance later approves a specialized page.
- Time Periods has a dedicated left-navigation page at `/dimensions/time-periods` for frequencies, periods, and reporting sequences.
- Time-period reporting sequences must use ordered `TIME_PERIOD` member sets, not hardcoded UI-only year arrays.
- Time Periods UI must support regular and irregular sequences, including `yyyy` and financial-year `yyyy-yy` display labels.
- Used reporting sequences must be displayed as immutable. The UI must disable edit/delete/remove-item actions for used sets and offer Copy as New Cycle/Version so admins can create the next reporting set without mutating historical scope.
- Template Designer must use `FROM_REQUEST` or `CONTRIBUTOR_SELECT` time-axis behavior for reusable templates instead of hardcoding period columns for each year.
