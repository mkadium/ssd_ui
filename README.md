# SSD UI Workspace

This folder is owned by the UI team.

Discussion, learning, option comparison, or draft decisions should be captured in `general/` first. Approved decisions that affect UI work must be reflected in governance and this workspace before implementation proceeds.

## Purpose

Contains the unified portal UI, dashboard screens, CMS screens, admin screens, GIS visualizations, report views, virtual book views, document management UI, bilingual content rules, responsive behavior, and accessibility implementation.

## Folder Roles

- `.init/` contains AI bootstrap rules, agents, skills, MCPs, boundaries, prompts, and workflow.
- `modules/` contains module context, UI contracts, page flows, component maps, API usage, release notes, dependencies, pending tasks, versions, known issues, and ownership.
- `frontend/` contains the new active UI implementation code for direct screen-by-screen development.
- `ui/` contains the previous Vite app scaffold/reference and should not be treated as the active implementation path unless governance/admin explicitly redirects work back to it.

## AI Bootstrap

Before UI work, Codex/Cursor must read:

- `ssd_ui/.init/agents.md`
- `ssd_ui/.init/rules.md`
- `ssd_ui/.init/skills.md`
- `ssd_ui/.init/mcps.md`
- `ssd_ui/.init/boundaries.md`
- `ssd_ui/.init/prompts.md`
- `ssd_ui/.init/workflow.md`

## Module Context

Each UI module must maintain:

- `RELEASE_NOTES.md`
- `AI_CONTEXT.md`
- `DEPENDENCIES.md`
- `PENDING_TASKS.md`
- `VERSION.md`
- `KNOWN_ISSUES.md`
- `UI_CONTRACTS.md`
- `PAGE_FLOWS.md`
- `COMPONENT_MAP.md`
- `API_USAGE.md`
- `ACCESSIBILITY_NOTES.md`
- `BILINGUAL_CONTENT_RULES.md`
- `RESPONSIVE_TEST_NOTES.md`
- `OWNERS.md`

## Implementation Module Structure

Active UI code lives under:

```text
ssd_ui/frontend/src/
```

Current active scaffold:

```text
ssd_ui/frontend/src/api/
ssd_ui/frontend/src/assets/
ssd_ui/frontend/src/components/
ssd_ui/frontend/src/hooks/
ssd_ui/frontend/src/layouts/
ssd_ui/frontend/src/lib/
ssd_ui/frontend/src/pages/
ssd_ui/frontend/src/providers/
ssd_ui/frontend/src/routes/
ssd_ui/frontend/src/stores/
```

Module behavior, contracts, page flows, component maps, API usage, and release context must still be tracked under `ssd_ui/modules/<module>/`.

Do not place implementation code under `ssd_ui/modules/<module>/`, and do not create `ssd_ui/frontend/modules/<module>/`.

## Frontend Development Direction

Build screens directly in `ssd_ui/frontend/` one workflow at a time.

Start with shell/navigation/theme, then implement:

1. Auth/login and current profile.
2. Dashboard shell and navigation review.
3. Masters and dimensions.
4. Templates and measure provider policy.
5. Requests, measure assignments, and alerts.
6. Data entry and ingestion.
7. Validation.
8. Review and approval.
9. Published data and dashboard drilldowns.
10. CMS/DMS when approved for implementation.
