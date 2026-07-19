# RELEASE NOTES

## Latest Update

- Fixed Template Studio column validation save behavior so UI preview column keys are not sent as real `cell_code` values.
- Fixed Template Studio validation binding for Data Field measures by auto-registering the selected measure as a template-version measure before creating the validation binding.
- Added Template Studio Settings drawer structure for Compute, Calculated, and Rollup configuration.
- Added formula-token picker behavior from deduplicated editable preview columns.
- Fixed formula-token picker so generated computed/calculated/rollup columns are not shown again as editable input columns.
- Fixed Template Studio error toast behavior so error messages auto-dismiss after a short delay.
- Removed separate `Validation (optional)` and `Indicator Mapping` wizard steps from Template Studio.
- Wired Template Studio Save Draft to persist/reload builder state and compute/calculated/rollup formula outputs after API restart from latest code.
- Kept provider-time formula execution as a later governed Data Entry/Validation integration.

| Field | Value |
|---|---|
| Module | Templates UI |
| Status | FRONTEND_API_BACKED_FOUNDATION |
| Last Updated | 2026-07-19 |

## v0.2.0
- Added API-backed Template Library at `/template/library`.
- Added API-backed Template Studio foundation at `/template/studio`.
- Added template definition and template version create drawers.
- Added governed Template Studio step sequence. Current visible Studio sequence is structure, recipients, preview, and publish.
- Implemented the first governed Structure step for `TIME_PERIOD` axes.
- Added `FROM_REQUEST`, `CONTRIBUTOR_SELECT`, and `FIXED_SET` behavior guidance for time-period handling.
- Enforced UI guidance that used/published time-period sets are referenced from templates and not edited inside Template Studio.
- Added render-contract preview foundation for selected template versions.

## v0.1.1
- Fixed Template Designer canvas axis rebinding behavior.
- Froze the canvas row-number column during horizontal scrolling.
- Preserved the Geography `Location` header when later binding Time Period, Area Type, Gender, or Measure options.
- Removed accidental Time Period auto-binding when binding Area Type or Gender.
- Fixed column-aligned Geography so members start at the first canvas column instead of leaving an empty leading column.
- Preserved existing column axes during rebuilds so adding Area Type under Geography expands each Geography member instead of replacing Geography.
- Fixed Row align / Column align so already-bound dimensions move immediately between row and column axes without duplicate rebuilds; new unbound dimensions still use Bind values to place them.
- Added first-pass DB v0.2 designer controls for measure defaults and Area Type rollup behavior.
- Fixed blank-cell selection so the options panel no longer shows stale group settings from the previous selection.
- Added measure-as-column UI behavior for indicators with multiple measures.
- Converted Freeze and Editable cells into toggle actions with visible canvas markers and browser tooltips.
- Added stacked Combine measure display where dimension labels can render above measure/unit labels while JSON remains relational.
- Fixed visible vertical alignment rendering for template canvas cells.
- Extended JSON preview with sample binding groups and rollup rules for enterprise template designer handoff.
- Refined Measure binding so measure mode no longer carries stale geography options: one selected measure is bound at a time, already-bound measures are hidden until unbound, and measure controls force column-header behavior.
- Fixed strict measure headers being replaced when a later Dimension bind regenerated the canvas axes.
- Fixed later Time/Area/Gender dimension headers rendering beside a strict measure header and hiding the first generated member; dimension headers now start below the preserved measure group.
- Added local column-dimension binding under strict measure headers, so Time/Area/Gender can be bound separately under each measure and the selected measure header expands across the generated columns.
- Fixed parallel strict measure groups disappearing when adding another dimension back under an earlier measure; sibling measure groups now shift right before the selected measure expands.
- Fixed unbind behavior for strict measure layouts: removing a measure now removes its local dimensions too, and removing a local dimension affects only that selected measure group.
- Fixed merged header editing so typed text appears in the visible merged cell instead of being written to a hidden merge child cell.
- Fixed row-axis alignment for local measure header stacks so `Location` merges across generated header rows and geography members move below the local headers.
- Enabled Combine measure for strict measure groups by stacking measure/unit text under the deepest local dimension headers.

## v0.1.0
- Created UI module context from ready Templates API contract.
- Implemented unit-scoped Template List + Designer sample-data screen at `/templates`.
- Added template list search/filter table with mapped national/global indicator, current version, status, and row actions.
- Added template draft creation, dimension value preview, template detail, and delete visual modal states.
- Added Excel-like designer preview with merged time headers, geography row axis, area type/gender columns, full-text match suggestions, and scrollable binding options panel.
- Added contract tab showing selected template version, axes, measures, and public stable codes.
- Added `ssd_ui/ui/src/data/templatesManagement.sample.ts` with contract-shaped template sample data.
- Registered `/templates` route behind the authenticated route guard.
- Verified lint and production build.
