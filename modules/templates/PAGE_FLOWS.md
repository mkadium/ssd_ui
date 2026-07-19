# PAGE FLOWS

| Flow ID | Flow | Status |
|---|---|---|
| TEMPLATES-FLOW-001 | Template Library list/filter/select | API_BACKED_FOUNDATION |
| TEMPLATES-FLOW-002 | Create template definition | API_BACKED_FOUNDATION |
| TEMPLATES-FLOW-003 | Create template version | API_BACKED_FOUNDATION |
| TEMPLATES-FLOW-004 | Open Template Studio from selected version | API_BACKED_FOUNDATION |
| TEMPLATES-FLOW-005 | Drag/drop Structure builder with live preview | UI_FOUNDATION |
| TEMPLATES-FLOW-006 | Recipient/source-specific view rules | PENDING_DETAILED_UI |
| TEMPLATES-FLOW-007 | Preview/publish readiness | PARTIAL_PREVIEW_FOUNDATION |
| TEMPLATES-FLOW-008 | Edit Studio reload from saved draft and formula output state | READY_FOR_LIVE_SMOKE |

## Template Library Flow

1. User opens `/template/library`.
2. UI loads templates using selected unit and locale.
3. User searches and filters by template name, code, description, and status.
4. User selects a template row.
5. UI opens a right-side template profile drawer.
6. UI lazily loads template versions for the selected row and reuses the cached version list during the same session.
7. User may create a template definition from the drawer.
8. User may create a draft template version from the selected template profile.
9. User opens Studio for a selected version.

## Template Studio Edit Flow

1. User opens `/template/studio`.
2. If route contains `template_code` and `version_code`, the Studio loads that version.
3. If route has no selected version, user selects template and version in the left Studio panel.
4. Structure is the default working step. Separate Validation and Indicator Mapping wizard steps are removed from the visible sequence.
5. Existing builder zones, cell mappings, preview settings, validation UI state, and generated output columns reload from the saved studio draft when available.

## Template Structure Builder Flow

1. User opens the Structure step.
2. UI shows the left Data Library.
3. Data Library exposes General dimension member sets, Geography member sets, Time-period reporting sequence sets, and Measures/Data Fields.
4. User drags library items into one of four zones:
   - Separate Into Tabs By
   - Each Row Represents
   - Show Across Columns
   - Fields To Fill
5. UI loads member-set items for dropped dimension/geography/time sets.
6. User may also drop directly on preview row headers, column headers, or editable cells.
7. Direct preview drops update the matching structure zone.
8. Live preview table updates automatically.
9. User may adjust preview settings such as codes, zebra rows, compact cells, and editable-cell highlighting.
10. If a time-period set is used, the template stores it as a governed `TIME_PERIOD` axis reference.
11. Template Studio can create a new time-period reporting sequence set for a future cycle.
12. User may open Settings to add generated Compute, Calculated, or Rollup values to Fields To Fill.
13. Generated values appear as non-editable preview columns and repeat under each active column group, such as every selected year.
14. Rollup choices come from existing dimension rollup rules for selected structure dimensions.
15. Save Draft persists the visible builder state and compute/calculated/rollup output definitions so Edit Studio can repopulate the prior design.

## Time-Period Loose-End Closure

- A new year/cycle must not be handled by editing a used period set.
- A new year/cycle must create a new time-period set/version, even when some or all members overlap with the previous set.
- Template axis references the selected set by public `member_set_code`.
- Requests and Data Entry must later resolve exact collection periods from request context when behavior is `FROM_REQUEST`.

## Pending Flows

- Full production hardening for axes, measures, cells, binding groups, render elements, and axis-member bindings.
- Recipient view rules based on measure source assignment, officer assignment, periodicity, and grain.
- Publish action with readiness checks.
