# UI CONTRACTS

## Dashboard UI Contract
- Read-only summary, chart, table, drilldown, review queue, and pipeline views are allowed.
- Direct `echarts` is allowed for standard charts only.
- Do not use GIS/map/geo chart features or unapproved chart libraries.
- Do not expose internal IDs, metadata JSON, raw payloads, source hashes, tokens, or secrets.
- Implemented Super Admin Dashboard is a sample-data foundation and must be replaced with approved Dashboard API calls during integration.
- Implemented Unit Admin Dashboard is a sample-data foundation and must be replaced with approved Dashboard plus related module API calls during integration.
- Implemented Submitted Snapshot Dashboard is a sample-data foundation and must be replaced with approved Dashboard API calls during integration.
- Snapshot/public dashboard views must show approved/published data only and keep internal review evidence protected.
