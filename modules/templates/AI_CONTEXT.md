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
