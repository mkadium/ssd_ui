# UI Agent Routing

Purpose:

Routes AI assistants working inside `ssd_ui/`.

## Read First

Before UI work, read:

- `ssd_ui/.init/agents.md`
- `ssd_ui/.init/rules.md`
- `ssd_ui/.init/skills.md`
- `ssd_ui/.init/mcps.md`
- `ssd_ui/.init/boundaries.md`
- `ssd_ui/.init/prompts.md`
- `ssd_ui/.init/workflow.md`

## Boundary

Actual UI implementation belongs only in direct module folders under `ssd_ui/ui/`, for example `ssd_ui/ui/portal/`.

UI context, contracts, page flows, component maps, API usage, releases, dependencies, and known issues belong under `ssd_ui/modules/`.

Do not create `ssd_ui/ui/modules/<module>/`. The `modules/` folder is reserved for context and contracts.

Use `Implement:`, `Review:`, and `SyncContext:` command prefixes for important UI requests.

If an important UI request has no command prefix, show the command options and wait. Do not implement or update files until the command mode is clear.
