# PAGE FLOWS

| Flow ID | Flow | Status |
|---|---|---|
| TEMPLATES-FLOW-001 | Template list to detail/version | SAMPLE_DATA_READY |
| TEMPLATES-FLOW-002 | Version to render-contract preview | SAMPLE_DATA_READY |
| TEMPLATES-FLOW-003 | Draft designer UX shell, blocked from persistence | INTERACTIVE_SAMPLE_READY |
| TEMPLATES-FLOW-004 | Full template design walkthrough from blank canvas to generated data-entry render | INTERACTIVE_SAMPLE_READY |

## Implemented Template Management Flow

1. Authenticated user opens `/templates`.
2. App Shell unit selector defines working unit scope.
3. User searches and filters template definitions by template, indicator, source, and status.
4. User opens detail, designer, or delete visual modal state from row actions.
5. User creates a draft template by selecting owning unit and national indicator before designer work begins.
6. Designer tab opens a blank Excel-like canvas.
7. Designer opens with one merged frozen indicator context row: indicator code, name, measure, source, unit, and periodicity.
8. User single-clicks a cell to edit it like Excel.
9. User types a search term such as `area` and sees full-text matches from sample indicator, dimension, and measure objects.
10. User selects a suggestion, which opens the options panel with the selected object and remaining configuration.
11. While typing, the active cell shows an inline ghost completion like an IDE. Enter or Tab accepts the first match and opens options.
12. User can double-click any cell to open the options panel without typing first.
13. Options remain open while the user clicks other canvas cells; closing is explicit.
14. User can open the designer in full-page mode for a larger canvas workspace.
15. User can move with arrow keys, select with Space, start editing with Enter, and exit edit mode with Enter/Escape.
16. User can open a live JSON structure modal from the designer toolbar to inspect how the current template maps to data-entry rows, columns, measures, and editable cells.
17. User can choose geography scope: national-only rows, state rows, national+state rows, national+state+district rows, or hierarchy columns for national-only, national+state, and national+state+district.
18. Hierarchy-column geography renders as row-axis columns such as Location, State, and District, so the user can build India -> State -> District style templates.
19. User can switch row/column alignment while options are open; the selected dimension moves between row axes and column axes without duplicating old rows.
20. If Time is moved to rows while Geography is already a row axis, rows become State x Time.
21. If Area Type is also added to rows, rows become State x Time x Area Type.
22. User can bind time as merged year headers and bind area type under each year dynamically.
23. Area Type binding regenerates a clean year -> total/rural/urban header structure and merges row-axis headers over the required header rows.
24. Gender binding regenerates the full time -> area_type -> gender nested header structure, so both Female and Male appear under every area/year combination.
25. Merged headers and bound values occupy the full visual width and height of the cell or merged span.
26. Geography keeps the row-axis header label as Location even after Time, Area Type, Gender, or Measure is selected in the options panel.
27. User can Shift-click to select a range, then merge, unmerge, freeze, mark cells editable, or apply horizontal/vertical alignment.
28. Selecting a cell inside a bound group selects the related range so options can be changed for that group.
29. User can unbind the selected dimension or measure group from the options panel; the grid rebuilds from the remaining axes.
30. User can resize columns and rows by dragging handles on canvas headers.
31. User can right-click column or row headers to insert a column or row into the canvas.
32. User can undo/redo canvas changes from toolbar buttons or Ctrl+Z/Ctrl+Y.
33. User previews object values and clicks Bind values; the selected object is written into the actual canvas.
34. User can bind manually or use Auto-build to generate the full example: Geography rows, Time merged headers, Area Type headers, Gender subgroup headers, and editable Indicator Value cells.
35. User previews the data-entry render that department users will fill.
36. User can validate/save the draft and mark it active in local UI state for walkthrough purposes.
37. Contract tab shows stable public version, axis, measure, cell, render-element, and validation-ref information for UI handoff.

## Integration Boundary

- Draft creation, binding, validation, publish, and delete are local sample-data interactions only.
- Real persistence must use governed Templates API mutation contracts once approved.
