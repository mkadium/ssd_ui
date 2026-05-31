# UI CONTRACTS

## Department Data Entry UI Contract
- `/data-entry` must show assigned request items before opening a workspace.
- `/data-entry` must render as a focused external-link page without left navigation or dashboard shell chrome.
- Assignment records must include request code, item code, template instance code, indicator, source organization, officer, due date, completion, issue count, and status.
- Opening an assignment must show a full data-entry workspace for one request item.
- Workspace must prioritize an Excel-like rendered template canvas.
- Selected cell context must show bound geography/time/area/measure, value type, unit, required flag, validation profile, and comment.
- Data-entry workspace must allow editing numeric measure cells only, plus reporting year labels where the template/request permits.
- Adding a year must generate the same governed cross-section columns from the template, such as area type and gender.
- Deleting a year must remove its generated cross-section columns and bound local values.
- Year label entry must show a format warning when it does not match `YYYY-YY` and a duplicate warning when values repeat.
- Data entry preview must be able to show a sanitized JSON object that maps request item, template instance, years, row geography, column dimensions, measure, unit, and numeric values.
- Geography, area type, gender, measure, unit, required flag, and validation rules must remain template-controlled in Data Entry.
- User notes must support both cell-level comments and submission-level reviewer notes.
- Draft/validate/preview/submit actions are visual states until API mutation integration is governed.
- Submit preview must show a sanitized governed summary only.
- Do not expose raw tokens, token hashes, raw payload bodies, source hashes, internal IDs, or metadata JSON.
