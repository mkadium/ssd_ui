# AI CONTEXT

## Module
Validation UI

## Status
VALIDATION_QUEUE_REPORT_SAMPLE_DATA

## Current Understanding
- API contract: `ssd_api/modules/validation/API_CONTRACTS.md`.
- API evidence: `DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED`.
- Implementation root: `ssd_ui/ui/src/`.
- Context root: `ssd_ui/modules/validation/`.
- Current API surface is read-only; validation execution is not API-triggered.
- Route implemented: `/validation`.
- Route implemented: `/validation/rules`.
- Current UI implementation: `ssd_ui/ui/src/pages/validation/ValidationQueuePage.tsx`.
- Current rules catalog implementation: `ssd_ui/ui/src/pages/validation/ValidationRulesCatalogPage.tsx`.
- Sample data: `ssd_ui/ui/src/data/validation.sample.ts`.
- Rules sample data: `ssd_ui/ui/src/data/validationRules.sample.ts`.
- Main page shows a validation queue of submitted request items.
- Clicking a queue record opens a validation report workspace.
- Report workspace is request/indicator-centered and includes indicator context, goal/target path, submitted-by/to, template preview, result counts, validation results, selected result detail, visual actions, and status trail.
- Template/cell drilldown is a visual modal only.
- Rules catalog shows validation rules, message templates, template bindings, severity, and status. It is read-only/sample-data until rule mutation APIs are approved.

## Scope
- Validation rules, bindings, runs, summary, report, results, and comparison evidence.
- Show indicator/request/template context where available through related APIs.
- Do not expose raw payloads, source hashes, internal IDs, tokens, or secrets.
- Do not trigger validation execution or review transition from this sample UI.
