# COMPONENT MAP

| Area | Purpose | Status |
|---|---|---|
| `src/pages/masters/FrameworkEditionSetupPage.tsx` | Framework edition, dynamic level/root/child hierarchy browser, node-depth search, coverage drilldown, and indicator mapping readiness screen | IMPLEMENTED_SAMPLE_DATA |
| `src/pages/masters/IndicatorManagementPage.tsx` | Indicator lifecycle workspace for national indicators, active version/change context, global mappings, metadata, and multiple source assignments | IMPLEMENTED_SAMPLE_DATA |
| `src/pages/masters/ReferenceMastersPage.tsx` | Reference Masters workspace for locales, organizations, officers, periodicities, units, and measures | IMPLEMENTED_SAMPLE_DATA |
| `src/App.tsx` | Route registration for `/masters/frameworks`, `/masters/indicators`, and `/masters/reference` | IMPLEMENTED |
| `src/services/` | Masters API service functions | PLANNED |
| `src/hooks/` | Masters query hooks | PLANNED |
| `src/components/` | Tables, filters, detail panels, modals | PLANNED |
| `src/data/frameworkSetup.sample.ts` | Sample data shaped like Masters framework, setup unit, hierarchy, and indicator/source assignment contracts | IMPLEMENTED |
| `src/data/mastersManagement.sample.ts` | Sample data shaped like categorized Masters DB objects and relationships, including Units referenced by Measures | IMPLEMENTED |
| `frontend/src/pages/framework/framework-page.tsx` | Framework editions, levels, nodes, and relationships administration with shared loading feedback | IMPLEMENTED |
| `frontend/src/pages/framework/framework-level-page.tsx` | Dynamic GOAL/TARGET and other hierarchy-level browsing with shared loading feedback | IMPLEMENTED |
| `frontend/src/components/common/loader.tsx` | Shared accessible loading indicator used by Framework overview and dynamic level pages | IMPLEMENTED |
| `frontend/src/pages/masters/masters-reference-page.tsx` | Shared Locales, Periodicities, UOM, Units, and Officers reference pages with accessible loading feedback | IMPLEMENTED |
