# UI CONTRACTS

## Dimensions UI Contract
- Read-only dimension, member, geography, and time-period views.
- Hierarchy browsers must use API stable codes and parent-child relationships.
- `/dimensions` is implemented as a unit-scoped sample-data management surface.
- Screen must expose dimension definition selection, hierarchy tree, selected-member details, member table, member sets, geography, and time-period tabs.
- Dimension definition selection includes search/filter and stat cards must summarize definition, hierarchy, member-set, and dependency context.
- Screen must expose a create-dimension modal state because dimensions are not limited to seeded examples.
- New root member creation may edit/select `dimension_code`; child creation must inherit the selected parent dimension.
- Root/child/create/edit/delete/bulk upload controls are UI states only until governed mutation APIs exist.
- Bulk upload examples must not imply live upload until API support is approved.
- No create/update/delete/bulk upload actions until mutation APIs are approved.
