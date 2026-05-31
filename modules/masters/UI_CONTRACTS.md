# UI CONTRACTS

## Masters UI Contract
- Read-only/sample-data management views must be categorized into:
  - Framework Setup: framework editions, hierarchy levels, hierarchy nodes, node relationships, framework indicator mappings.
  - Indicator Management: national indicators, global indicators, national/global mappings, indicator versions, metadata details, indicator source assignments.
  - Reference Masters: locales, organizations, officers, periodicities, units, measures.
- Search/filter/sort/page list views where API supports it.
- Detail modals/panels may show stable codes and localized labels.
- No create/update/delete actions until mutation APIs are approved.
- Implemented Framework Edition Setup is a sample-data foundation and must be replaced with approved Masters API calls during integration.
- Implemented Indicator Management and Reference Masters workspaces are sample-data foundations and must be replaced with approved Masters API calls during integration.
- Framework hierarchy browser must use stable codes and localized names from API, not display labels as business keys.
- SDG Goal/Target are seeded hierarchy records only; UI must treat hierarchy levels/nodes as dynamic DB data.
- Framework hierarchy UI must expose separate actions for creating a level, creating a parent/root node, and creating a child node.
- Framework Setup must use the shared App Shell unit selector before edition/hierarchy operations.
- Add child node forms must show the selected parent context and child level; the tree header should avoid duplicate Add child actions because Add child belongs to the selected-node panel.
- Framework hierarchy search must preserve parent context when a lower-level node matches and must show node depth.
- Framework indicator coverage must support node drilldown from top-level nodes to children to indicators and open indicator detail from a selected indicator.
- Indicator mapping form must target framework nodes whose dynamic level has `allows_indicator_mapping=true`.
- One indicator may map to multiple source assignments. UI must show source assignments as related rows, not a single source-only field.
- Indicator Management must keep source organization/officer/periodicity out of the base indicator form; those fields belong to source assignment rows.
- Indicator Management must show current active version and changes being prepared against that version.
- Reference Masters must include Units and use Units from Measures through `unit_code`.
- Officer create/edit must map officers to ministry/department/division through `organization_code`.
- Indicator/source/reference actions may show create/edit/delete UI states for UX review, but API integration must wait for governed Masters mutation APIs.
