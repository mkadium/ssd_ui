# COMPONENT MAP

| Area | Purpose | Status |
|---|---|---|
| `src/pages/dimensions/DimensionsManagementPage.tsx` | Unit-scoped Dimension Management screen with hierarchy tree, tables, modal states, and usage panel | IMPLEMENTED_SAMPLE_DATA |
| `src/data/dimensionsManagement.sample.ts` | Contract-shaped sample data for dimension definitions, members, member sets, geographies, time periods, and usage | IMPLEMENTED |
| `src/App.tsx` | Route registration for `/dimensions` | IMPLEMENTED |
| `src/services/` | Dimensions API service functions | PLANNED |
| `src/hooks/` | Dimension query hooks | PLANNED |
| `src/components/` | Hierarchy browser, table, filters, detail panels | IMPLEMENTED_IN_PAGE_SAMPLE |
| `frontend/src/pages/dimensions/dimension-library-page.tsx` | Dimension Library with shared loader and modern parent-scrolling drawers | IMPLEMENTED |
| `frontend/src/pages/dimensions/geography-page.tsx` | Geography records, sets, and rollups with shared loader and modern drawers | IMPLEMENTED |
| `frontend/src/pages/dimensions/time-periods-page.tsx` | Time periods, sequences, and frequencies with shared loader and modern drawers | IMPLEMENTED |
| `frontend/src/components/common/loader.tsx` | Shared accessible loading feedback across Dimension pages | IMPLEMENTED |
