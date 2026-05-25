# UI Prompts

Use `Implement:` for UI implementation, `Review:` for UI reviews, and `SyncContext:` for context-only updates. Follow `ssd_governance/ai/prompt_command_standard.md`.

If an important UI request has no command prefix, show the supported command options and wait. Do not implement, update context files, or call external systems until the command mode is clear.

## File Discovery Rule

If `Files To Read` or `Files To Update` says Codex should identify or suggest files, use the active work packet, `ssd_ui/.init/`, UI module context, API contracts, approved technology stack, CI/CD profile, deployment matrix, and Jira mapping to prepare a read/update plan. Confirm before editing.

## UI Implementation Prompt

Read `ssd_ui/.init/`, the active work packet, approved technology stack, approved UI libraries, target UI module context files, and approved API contracts first. Implement UI changes within scope only inside `ssd_ui/ui/`. Do not introduce unapproved UI frameworks/libraries/tools. If UI build, artifact, hosting model, CDN/static/server/container deployment, environment promotion, or Jira workflow behavior changes, read the related governance deployment, CI/CD, and Jira matrix files and update the work packet impact sections. Update all relevant UI context files.

## UI Review Prompt

Review the UI change for API contract alignment, approved stack compliance, accessibility, responsiveness, bilingual readiness, duplicate components, CI/CD impact, security-sensitive UI behavior, release impact, and missing context updates.
