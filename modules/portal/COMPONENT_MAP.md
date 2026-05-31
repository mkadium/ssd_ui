# COMPONENT MAP

## Module
Portal

| Component | Purpose | Status |
|---|---|---|
| `src/components/ui/button.tsx` | Shared shadcn/ui-compatible button primitive | STARTED |
| `src/components/` | Shared reusable component folder | STARTED |
| `src/pages/` | Page-level UI folder | STARTED |
| `src/routes/` | Route definition and route guard folder | STARTED |
| `src/services/` | API service/client wrapper folder | STARTED |
| `src/hooks/` | Shared React hook folder | STARTED |
| `src/providers/auth-provider.tsx` | React Context auth provider; replaces unapproved global store usage | STARTED |
| `src/api/client.ts` | Native `fetch` API request helper | STARTED |
| `src/components/layout/AppShell.tsx` | Authenticated shell with sidebar, top bar, dashboard selector, shared unit selector, language selector, reminders, notifications, tour, and admin controls | STARTED |
| `src/components/charts/EChart.tsx` | Direct `echarts` chart host with dynamic chart module loading | STARTED |
| `src/components/auth/ProtectedRoute.tsx` | Authenticated route guard | STARTED |
| `src/data/auth.sample.ts` | Temporary sample Auth API-shaped role login data | STARTED |
| `src/data/superAdminDashboard.sample.ts` | Contract-shaped sample data for Super Admin Dashboard | STARTED |
| `src/data/unitAdminDashboard.sample.ts` | Contract-shaped sample data for Unit Admin Dashboard | STARTED |
| `src/data/submittedSnapshotDashboard.sample.ts` | Contract-shaped sample data for Submitted Snapshot Dashboard | STARTED |
| `src/data/unitScope.sample.ts` | Shared sample unit-scope options used by the App Shell | STARTED |
| `src/data/frameworkSetup.sample.ts` | Contract-shaped sample data for Framework Edition Setup | STARTED |
| `src/data/mastersManagement.sample.ts` | Contract-shaped sample data for categorized Masters screens | STARTED |
| `src/data/dimensionsManagement.sample.ts` | Contract-shaped sample data for Dimension Management | IMPLEMENTED |
| `src/data/userExperience.sample.ts` | Sample data for Profile, Preferences, Reminders, and Notifications | IMPLEMENTED |
| `src/pages/auth/LoginPage.tsx` | Login / Role Landing screen | STARTED |
| `src/pages/dashboard/SuperAdminDashboardPage.tsx` | First 1366x768 baseline Super Admin Dashboard screen | STARTED |
| `src/pages/dashboard/UnitAdminDashboardPage.tsx` | Unit Admin Dashboard screen | STARTED |
| `src/pages/dashboard/SubmittedSnapshotDashboardPage.tsx` | Submitted Snapshot Dashboard screen | STARTED |
| `src/pages/masters/FrameworkEditionSetupPage.tsx` | Framework Edition Setup screen | STARTED |
| `src/pages/masters/IndicatorManagementPage.tsx` | Indicator Management screen | STARTED |
| `src/pages/masters/ReferenceMastersPage.tsx` | Reference Masters screen | STARTED |
| `src/pages/dimensions/DimensionsManagementPage.tsx` | Dimension Management screen | IMPLEMENTED_SAMPLE_DATA |
| `src/pages/portal/ProfilePage.tsx` | Profile summary screen | IMPLEMENTED_SAMPLE_DATA |
| `src/pages/portal/PreferencesPage.tsx` | Personal preferences screen | IMPLEMENTED_SAMPLE_DATA |
| `src/pages/portal/RemindersPage.tsx` | Reminder list and detail screen | IMPLEMENTED_SAMPLE_DATA |
| `src/pages/portal/NotificationsPage.tsx` | Notification list and detail screen | IMPLEMENTED_SAMPLE_DATA |
| `src/stores/` | Not used for Auth; do not introduce unapproved global state behavior | NOT_USED |
| `src/utils/` | Shared utility folder | STARTED |
