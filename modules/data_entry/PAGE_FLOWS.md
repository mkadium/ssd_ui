# PAGE FLOWS

## DATA-ENTRY-FLOW-001
1. Authenticated department user opens `/data-entry`.
2. User sees assigned request items in an inbox with search, status filter, and completion/issue indicators.
3. User clicks an assignment row or Open action.
4. UI opens the full template workspace for that assignment.
5. User edits governed numeric template cells, reviews selected cell context, and adds comments/notes.
6. User can edit reporting year labels or add another year group. The grid automatically generates the same area type and gender cross-section columns for the new year.
7. User can delete a year group if more than one year remains.
8. UI warns if a year label does not match `YYYY-YY`, for example `2011-12`, or if another year uses the same display value.
9. UI rejects non-numeric data-cell entry because editable cells are bound to the numeric percent measure.
10. User can navigate cells with arrow keys, select with Space, start edit with Enter, and exit edit mode with Enter/Escape.
11. UI recalculates missing required values and completion count from local sample-data state.
12. User previews the dynamic data-entry JSON object before submit; added/deleted year groups update that object automatically.
13. User saves draft, validates, previews submit, then submits when validation is clear and year labels are valid.
14. Submit handoff is expected to create ingestion submission/version/manifest records after API integration.

## UX Rule
Keep request assignment selection separate from template editing. The user should always know whether they are choosing work or filling a template.

## Integration Boundary

- Cell editing, save draft, validate, preview submit, and submit are interactive sample-data behavior only.
- Real persistence must later call governed Requests/Ingestion/Validation APIs and must not expose raw payloads, hashes, tokens, or internal IDs.
