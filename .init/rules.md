# UI Development Rules

Purpose:

Defines mandatory UI team rules for AI-assisted development.

## Mandatory Rules

- Important requests must use a command prefix from `ssd_governance/ai/prompt_command_standard.md`.
- If no command is provided for important work, Codex must show command options and wait; it must not implement or update files.
- `Implement:` requires an active work packet unless the Governance Owner explicitly says the work is setup/bootstrap.
- Read `ssd_ui/.init/` before UI work.
- Read the active work packet before task-specific work.
- Read approved API contracts before API integration.
- Follow only governance-approved UI technology stack and libraries.
- For first demo/MVP, the approved UI stack is React + Vite + TypeScript + Tailwind.
- For first demo/MVP, approved UI supporting libraries are react-router/react-router-dom, shadcn/ui, lucide-react, TanStack Query, React Hook Form, and Zod.
- For first demo/MVP, approved UI hosting is S3 static hosting with safe references `ssd_dev` for DEV and `ssd_uat` for UAT.
- Do not introduce Next.js, charting, GIS/maps, global client state management, i18n, or additional UI libraries unless separately approved.
- Use TanStack Query for API/server state only; do not use it as a general local/global state store.
- Use React Hook Form with Zod for governed forms and validation.
- Use shadcn/ui with the approved Tailwind stack only; do not introduce another component library without approval.
- Use lucide-react as the standard UI icon library; do not introduce another icon library without approval.
- Put actual UI implementation only under `ssd_ui/ui/`.
- The current Vite app scaffold is organized under `ssd_ui/ui/src/` with shared folders for `assets`, `components`, `hooks`, `lib`, `pages`, `routes`, `services`, `stores`, and `utils`.
- Keep module ownership traceable through `ssd_ui/modules/<module>/` even when implementation files live in shared `src` folders.
- Do not create `ssd_ui/ui/modules/<module>/`; `ssd_ui/modules/<module>/` is the context/contract folder only.
- Keep `ssd_ui/modules/` for AI context and module documentation only.
- Keep `ssd_ui/.init/` for AI bootstrap only.
- Do not assume API behavior that is not documented.
- Maintain responsive, cross-browser, and accessibility-aware UI.
- Support bilingual content rules where required.
- Follow DEC-2026-004 for multilingual/i18n readiness.
- Use API-provided domain metadata labels for master, template, validation, workflow, dashboard, and reporting content where available.
- Do not hardcode governed domain labels in UI when they should come from DB/API metadata.
- Do not introduce a UI i18n library until multilingual UI implementation starts and governance approves the library.
- Do not hardcode secrets, credentials, tokens, or environment-specific URLs.
- Real `.env` files must remain local/build-server-side only and must not be committed.
- `.env.example` files may be maintained with placeholder keys only.
- DEV/UAT/STG/PROD build/deployment secrets must come from approved CI/CD environment secret handling.
- Keep reusable UI components consistent and avoid duplicate components. Shared UI utilities/components must be approved and documented in the active work packet and module `DEPENDENCIES.md`.
- Update mandatory UI context files after every change.
- React, Vite, TypeScript, Tailwind, react-router/react-router-dom, shadcn/ui, lucide-react, TanStack Query, React Hook Form, and Zod are approved for first demo/MVP. Do not introduce Next.js, charting libraries, map/GIS libraries, global client state management tools, i18n libraries, accessibility tooling, other icon libraries, or extra UI dependencies until governance approves them separately.
- Do not create or modify CI/CD pipelines, UI build automation, artifact publishing, deployment automation, or environment promotion rules without checking `ssd_governance/cicd/`.
- If a required UI technology is not approved, raise a library approval request through governance.
- Tool, filesystem, MCP, connector, or terminal access does not permit bypassing command mode, stack approval, work packet scope, UI boundaries, or secret rules.
