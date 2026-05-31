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
