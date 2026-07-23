# COMPONENT MAP

| Area | Purpose | Status |
|---|---|---|
| `src/pages/requests/CollectionRequestPage.tsx` | Collection request list, create wizard, scope, assignments, trail, and modal states | IMPLEMENTED_SAMPLE_DATA |
| `src/pages/requests/dispatch-settings-page.tsx` | Governed dispatch/submission policy settings list, detail, drawer form, status toggle, and 125% zoom-friendly layout | IMPLEMENTED_LIVE_API |
| `src/pages/requests/dispatch-plans-page.tsx` | Reusable Dispatch Plan and Dispatch Run planning page with right drawer forms and compact 1366x768 layout | IMPLEMENTED_PENDING_LIVE_SMOKE |
| `src/api/requests.api.ts` | Dispatch policy, dispatch plan, and dispatch run API clients and default payload helpers | IMPLEMENTED |
| `src/App.tsx` | `/requests` route registration | IMPLEMENTED_SAMPLE_DATA |
| `src/services/` | Requests API service functions | PLANNED |
| `src/hooks/` | Request query hooks | PLANNED |
| `src/data/requestsManagement.sample.ts` | Contract-shaped Requests sample data | IMPLEMENTED_SAMPLE_DATA |
| `src/components/` | Queues, status trail, tables, detail panels | IMPLEMENTED_IN_PAGE |
