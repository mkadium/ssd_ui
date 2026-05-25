# UI Implementation Folder

This folder contains the actual UI source code.

## Boundary

- Put UI implementation code here.
- Organize implementation by direct module folder, for example `ssd_ui/ui/portal/`.
- Do not put implementation code in `.init/`.
- Do not put implementation code in `modules/`.
- Do not create `ssd_ui/ui/modules/<module>/`.
- Keep `modules/` for UI contracts, page flows, component maps, API usage, accessibility notes, release notes, dependencies, and task tracking.

## Recommended Structure

```text
ssd_ui/ui/
|-- <module>/
|   |-- pages/
|   |-- components/
|   |-- services/
|   |-- hooks/
|   |-- routes/
|   |-- forms/
|   |-- schemas/
|   `-- queries/
`-- shared/
```

Use `shared/` only for approved cross-module UI utilities/components. Document shared usage in the active work packet and module `DEPENDENCIES.md`.

## Before Starting From Scratch

1. Read `ssd_ui/.init/`.
2. Read the active work packet in `ssd_governance/work_packets/`.
3. Read `ssd_governance/libraries/technology_stack_registry.md`.
4. Confirm UI framework, package manager, styling, routing, component library, data fetching, forms, validation, charting, GIS/maps, state management, i18n choices, and any CI/CD/build/deployment tooling are approved.
5. Read the target module context under `ssd_ui/modules/<module>/`.
6. Read approved API contracts from `ssd_api/modules/<module>/`.
7. Set up the local UI environment only after the stack is approved.

## Environment Setup Rule

Approved first-demo/MVP UI libraries are React, Vite, TypeScript, Tailwind, react-router/react-router-dom, shadcn/ui, lucide-react, TanStack Query, React Hook Form, and Zod.

Do not introduce Next.js, charting libraries, GIS/map libraries, global client state management libraries, i18n libraries, accessibility tools, other icon libraries, build tools, CI/CD tools, artifact publishing, deployment automation, or extra UI dependencies unless approved in governance.

## Codex Prompt Guideline

Use this pattern:

```text
Read ssd_ui/.init, the active work packet, ssd_governance/libraries/technology_stack_registry.md, ssd_ui/modules/<module>/ context files, and approved API contracts.
If the required UI stack is approved, work only inside the target direct module folder, for example ssd_ui/ui/<module>/.
Keep UI aligned with API contracts, accessibility, bilingual, and responsive requirements.
After implementation, update module context files: RELEASE_NOTES.md, AI_CONTEXT.md, DEPENDENCIES.md, PENDING_TASKS.md, VERSION.md, KNOWN_ISSUES.md if applicable, UI_CONTRACTS.md, PAGE_FLOWS.md, COMPONENT_MAP.md, API_USAGE.md, ACCESSIBILITY_NOTES.md, BILINGUAL_CONTENT_RULES.md, and RESPONSIVE_TEST_NOTES.md if changed.
If pipeline, artifact, deployment, or environment promotion behavior changes, read ssd_governance/cicd and update the active work packet CI/CD impact.
Do not introduce unapproved libraries or modify governance files unless asked.
```

## After Every Task

Update the relevant module files under `ssd_ui/modules/<module>/` and update the active work packet if status, blockers, dependencies, API usage, accessibility readiness, CI/CD impact, or handoff readiness changed.
