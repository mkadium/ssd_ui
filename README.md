# SSD UI Workspace

This folder is owned by the UI team.

Discussion, learning, option comparison, or draft decisions should be captured in `general/` first. Approved decisions that affect UI work must be reflected in governance and this workspace before implementation proceeds.

## Purpose

Contains the unified portal UI, dashboard screens, CMS screens, admin screens, GIS visualizations, report views, virtual book views, document management UI, bilingual content rules, responsive behavior, and accessibility implementation.

## Folder Roles

- `.init/` contains AI bootstrap rules, agents, skills, MCPs, boundaries, prompts, and workflow.
- `modules/` contains module context, UI contracts, page flows, component maps, API usage, release notes, dependencies, pending tasks, versions, known issues, and ownership.
- `ui/` contains actual UI implementation code, organized by direct module folder such as `ui/portal/`.

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

Actual UI code for a module must live under:

```text
ssd_ui/ui/<module>/
```

Example:

```text
ssd_ui/ui/portal/
```

Do not place implementation code under `ssd_ui/modules/<module>/`, and do not create `ssd_ui/ui/modules/<module>/`.
