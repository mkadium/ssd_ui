# RELEASE NOTES

| Field | Value |
|---|---|
| Module | Validation UI |
| Status | VALIDATION_QUEUE_REPORT_SAMPLE_DATA |
| Last Updated | 2026-05-31 |

## v0.1.0
- Created UI module context from ready Validation API contract.
- Added `/validation` route.
- Added validation queue with submitted request-item records.
- Added validation report workspace with indicator context, goal/target path, submitted-by/to, template preview, result counts, results table, selected result detail, visual actions, and status trail.
- Added sanitized template/cell drilldown modal.
- Added `ssd_ui/ui/src/data/validation.sample.ts` with contract-shaped validation sample data.
- Added `/validation/rules` route for validation rule catalog and binding inspection.
- Added `ssd_ui/ui/src/data/validationRules.sample.ts` with rule and template-binding sample data.
- Kept rule editing/execution as future governed API work.
