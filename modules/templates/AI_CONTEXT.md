# AI CONTEXT

## Module
Templates UI

## Status
TEMPLATE_MANAGEMENT_INTERACTIVE_SAMPLE_FLOW

## Current Understanding
- API contract: `ssd_api/modules/templates/API_CONTRACTS.md`.
- API evidence: `DEV_AUTHENTICATED_ENDPOINT_EVIDENCE_CAPTURED`.
- Implementation root: `ssd_ui/ui/src/`.
- Context root: `ssd_ui/modules/templates/`.
- Current API surface is read-only.
- Route implemented: `/templates`.
- Current UI implementation: `ssd_ui/ui/src/pages/templates/TemplateManagementPage.tsx`.
- Sample data: `ssd_ui/ui/src/data/templatesManagement.sample.ts`.
- The screen is unit-scoped through the shared App Shell unit selector.
- Current UI includes Template list, Designer, and Contract tabs.
- UI-only in-action demo is implemented for creating a local draft, opening the designer, editing cells, typing/searching in a blank cell, selecting indicator/dimension/measure matches, previewing dimension values, binding objects to the selected range, merging/unmerging ranges, freezing/editable marking, auto-building the full NIF 1.2.1 example, validating/saving the draft, previewing the data-entry render, and marking the template active for walkthrough purposes.
- Template list exposes search, status filter, mapped indicator/global indicator context, version code, cell count, status chips, and view/design/delete visual actions.
- Designer starts with one merged frozen indicator context row, displayed as a single non-wrapping line: indicator code, name, measure, source, unit, and periodicity. Single click selects and edits a cell; typing opens autosuggestions; selecting a suggestion opens the options panel; double-click opens options directly; Shift-click selects a multi-cell range. The options panel stays open while users move around the canvas and is closed only when the user explicitly closes it.
- Bind values writes the selected object into the actual canvas, not only into side state. Dimension binding now uses a cartesian axis-layout rebuild so newly added dimensions regenerate the governed grid instead of duplicating old rows/columns. Geography binding supports state-only, national+state, national+state+district, and Country/State/District hierarchy-column layouts. Row alignment writes members vertically as row axes. Column alignment writes members horizontally as column axes. Changing row/column alignment while options are open moves the selected dimension between row and column axes.
- Merged headers and bound values stretch across the full rendered canvas cell or merged cell span. The Geography row-axis header remains `Location` even when the selected options panel object changes to Time, Area Type, Gender, or Measure.
- Geography scope now includes national-only rows plus hierarchy-column layouts for national-only, national+state, and national+state+district. Hierarchy-column geography is forced to row alignment so the canvas can render Location/State/District columns instead of a flat geography list.
- The active typing cell shows an IDE-style inline ghost completion from the best matching indicator/dimension/measure object. Pressing Enter or Tab accepts the first match and opens the options panel.
- Template Designer includes a full-page editing mode so the canvas and options panel can use the viewport without the normal page chrome constraining the workspace.
- Template Designer canvas supports keyboard interaction: arrow keys move the selected cell, Space selects the focused cell, Enter starts editing from a selected cell, and Enter/Escape exits edit mode from the active editor.
- Template Designer includes a live JSON structure preview modal. The JSON is regenerated from the current canvas state, bound row/column axes, geography scope, measure settings, editable cells, and data-entry binding shape.
- Row axes and column axes are both dynamic arrays. Example: Geography row + Time row produces State x Time rows. Adding Area Type as row produces State x Time x Area Type rows. Time, Area Type, and Gender as columns produce ordered nested column headers. Adding Area Type after Time regenerates Time -> Total/Rural/Urban. Adding Gender regenerates Time -> Area Type -> Female/Male and keeps row-axis headers merged over the required header depth. Measure bindings mark editable input cells. Merge, unmerge, freeze, editable-cell, horizontal-align, and vertical-align actions operate on the selected range.
- Bound header/member groups carry local group metadata so selecting any cell in the related group selects the whole group/range for option changes. Canvas columns and rows include drag handles for resize flexibility. Column and row headers support right-click insertion. Undo/redo is available through toolbar buttons and Ctrl+Z/Ctrl+Y.
- Options include Unbind selected group. Unbinding a dimension removes it from row/column axes and rebuilds the grid. Unbinding the measure removes editable input cells while keeping axes. The indicator context row is required and cannot be unbound.
- 2026-06-01 canvas fix: Geography row headers now preserve the existing `Location` label when Time/Area Type/Gender are selected later. Column-aligned Geography no longer creates an empty leading column. Binding Area Type or Gender no longer auto-adds Time Period; the user controls axis order by the selected header row, and existing column axes are preserved during rebuild. Row align / Column align now immediately moves an already-bound dimension between row and column axes without duplicating old rows/columns.
- 2026-06-01 v0.2 designer start: Template canvas row numbers are sticky while horizontally scrolling. Options panel now exposes first-pass enterprise binding controls for measure defaults (`INDICATOR_VALUE`, `PERSON_COUNT`, `POVERTY_RATE`) and Area Type rollup behavior (`MANUAL`, `DERIVED`, `MANUAL_WITH_VALIDATION`; `SUM`, `AVG`, `WEIGHTED_AVG`, `MIN`, `MAX`, `NO_ROLLUP`). JSON preview now includes sample `binding_groups` and `rollup_rules` shaped for the DB v0.2 contract.
- 2026-06-01 interaction cleanup: Selecting a blank canvas cell resets the options context instead of keeping the previously selected binding group. Selecting a bound measure/input cell syncs the options panel to Measure settings and the matching measure code. Freeze and Editable cells are now toggles with visible canvas markers and activity messages.
- Measure binding is now strict per selected measure. Choose Header type `Measure`, select one available measure, then Bind values to place that measure header on the selected cell/range. Bound measures are hidden from the measure dropdown until their header group is unbound, preventing accidental duplicate measure columns or geography/member rebinding.
- Strict measure headers are preserved when later binding or re-aligning dimensions. Dimension axis rebuilds should not overwrite manually placed measure header groups.
- When strict measure headers already occupy the top template header row, later Time/Area/Gender dimension headers are generated on the next row below the measure group so the first dimension member is not hidden by the preserved measure cell.
- Column dimensions can be bound locally under a selected strict measure header. Example: after binding `Indicator value [PERCENT]` and `Person count [NUMBER]`, selecting the row below `Person count` and binding `Time period` generates `2011-12` and `2012-13` under `Person count` only, and expands the `Person count` header across those columns.
- When a local dimension expands one strict measure group, later measure groups to the right are shifted right before repainting. This preserves parallel measure layouts such as `Indicator value` and `Person count` when the user returns to the first measure and adds another dimension under it.
- Unbind behavior is strict-measure aware. Unbinding a measure removes the whole measure column block, including any local Time/Area/Gender headers under it, and shifts later measure blocks left. Unbinding a local dimension under a measure repaints only that selected measure group instead of removing the same dimension from other measures.
- Merged cells are editable through the visible merge owner. Typing into a merged header writes to the owner cell, so text appears immediately instead of being written to a hidden merged child cell.
- Local measure header stacks now relayout row axes: the `Location` row header merges down across the measure/dimension header depth, and geography members move to the first data row below the generated local headers.
- Combine measure now supports strict measure groups. In strict measure mode it stacks the selected measure/unit text under the deepest local dimension header cells instead of showing the old global-axis warning.
- 2026-06-01 stacked header cleanup: Combine measure toggles a compact visual mode where the nearest selected column dimension is shown above measure/unit text, for example `Total` over `Person count [NUMBER]`. The template JSON preserves separate dimension axis members and `measure_code`; the combine behavior is recorded as `header_combine_rules`.
- Vertical align is now reflected in canvas rendering through top/middle/bottom flex alignment, including merged and stacked header cells.
- The designer can also generate the full governed layout: Geography row axis, Time merged headers, Area Type subgroup headers, Gender subgroup headers, and editable Indicator Value cells.
- Contract tab exposes the generated relation targets: axes, axis members, measures, cells, cell-axis members, render elements, and validation rule refs using stable public codes.
- New template, view values, template detail, and delete are modal visual states only until governed template mutation APIs exist.
- No template data is persisted to API/DB. The in-action flow is local React state only and must later be replaced by governed template mutation APIs.
- The current implementation is intended to demonstrate how template design works end-to-end before building mutation APIs.

## Scope
- Template list/detail/version screens and render-contract viewer.
- Template designer UX can be prototyped, but save/publish mutations need governed APIs.
- Use render-contract axes, measures, cells, render elements, and validation refs from API.

## Warnings
- Do not invent persistence for template designer without API contract.
- Template grid must keep stable codes hidden from casual display but available in UI state.
