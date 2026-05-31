# AI CONTEXT

## Module
Application Setup / Branding UI

## Status
APPLICATION_SETUP_SAMPLE_DATA

## Current Understanding
- Route implemented: `/application-setup`.
- Current UI implementation: `ssd_ui/ui/src/pages/application-setup/ApplicationSetupPage.tsx`.
- Sample data: `ssd_ui/ui/src/data/applicationSetup.sample.ts`.
- Screen supports portal title/subtitle, support email, default language, public dashboard toggle, placeholder asset paths, theme tokens, and unit-level branding overrides.
- Local file root is represented as `files/ui/branding/`.
- Upload/save/publish/reset actions are visual states only.

## Boundaries
- Do not upload real files.
- Do not store real asset binaries from UI.
- Do not modify API or database.
- Use empty local paths as placeholders until governed Application Setup/storage APIs exist.
