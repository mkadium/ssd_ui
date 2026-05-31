# UI CONTRACTS

## Validation UI Contract
- Read-only validation rule, binding, run, summary, report, result, and comparison views are allowed.
- `/validation` must show a validation queue before report detail.
- Queue records must be submitted request-item oriented and include request, item, submission, indicator, source organization, submitted-by/to, received time, result counts, and status.
- Clicking a queue row must open a report workspace for that validation run.
- Report must show indicator context, goal/target path, template instance, submitted-by/to, result count cards, template preview, results table, selected result detail, status trail, and visual actions.
- Template/cell drilldown may be shown in a modal but must remain sanitized.
- Do not trigger validation execution until API/governance approves it.
- Do not expose raw payloads, source hashes, internal IDs, tokens, token hashes, secrets, or sensitive full response bodies.
