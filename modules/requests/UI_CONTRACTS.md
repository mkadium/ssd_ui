# UI CONTRACTS

## Requests UI Contract
- Read-only cycle, request, item, scope, template instance, and assignment views are allowed.
- `/requests` is implemented as a unit-scoped sample-data management surface.
- Request creation UX may be prototyped visually with cycle, source organization/officer, indicator item, template version, scope members, and assignments.
- Request list must show stable request code, source organization, officer, due date, priority/type, status, and row actions.
- Request list is the primary entry point; clicking a request row opens a request detail modal.
- Create request is a modal action, not a separate tab.
- Items & Scope, Assignments, and Status Trail must be shown inside the selected request detail modal because they are request-scoped.
- Main `/requests` page must remain a request records list with search/filter/pagination.
- Creation UX must follow database object order: collection cycle, request header, request items, request scope members, template instance, request assignments, then governed send/token handling.
- Item & Scope must default to a template canvas preview. Row-list and JSON previews are secondary modal views for audit/troubleshooting.
- Scope row preview must show request item, template instance context, axis, dimension, member, scope role, source type, and required flag.
- Status trail must connect Request, Data Entry, Ingestion, Validation, Review, and Dashboard using stable public codes only.
- No request creation, assignment mutation, status mutation, or token display until APIs are approved.
- Do not expose raw request tokens, token hashes, internal IDs, or metadata JSON.

## Dispatch Settings UI Contract

- `/requests/dispatch-settings` is the governed admin surface for request dispatch/submission defaults.
- Dispatch settings must support global/unit/template/source scoped policies, with global defaults used when no narrower active policy exists.
- The UI must expose access rules, OTP validity/attempt/resend settings, schedule defaults, submission methods, submission controls, evidence/certification text, allowed attachment types, file size, and reminder day offsets.
- Default values must match governance: open submit, OTP validity 10 minutes, max attempts 3, resend limit 0/unlimited, web form/Excel/manual entry enabled, save draft and late submission enabled, revision after approval disabled, lock after approval enabled, evidence/certification enabled, PDF/XLSX/CSV/JPG/PNG allowed, 20 MB maximum file size.
- Policy forms use right drawer behavior and must not refresh the full page after save/status changes.

## Dispatch Plan UI Contract

- `/requests/dispatch-plans` is the governed planning surface used before creating request/dispatch records.
- A dispatch plan is reusable across request years/cycles so users do not rebuild the full dispatch wizard every year.
- A dispatch plan stores the published template version, mapped indicators, dispatch policy, source/measure provider grouping, recipient rules, and reporting-period behavior using stable public codes.
- A dispatch run is created from a dispatch plan for one request period.
- Request Period means the request cycle/year being sent, such as `2026`.
- Reporting Period means the data period generated for the request, such as `2020-2026`; it is derived from plan rules and may later be adjustable at request/data-entry level without editing the published template.
- Supported reporting-period modes are `EXPANDING_RANGE`, `FIXED_SET`, `CONTRIBUTOR_SELECT`, and `REQUEST_CONFIGURABLE`.
- Plan and run forms use right drawer behavior and must update local list/detail state without full-page refresh.
- The UI must preserve published template immutability; plan/run setup may reference a published template version but must not edit its structure.
