
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";

const LoginPage = lazy(() => import("@/pages/auth/LoginPage").then((module) => ({ default: module.LoginPage })));
const SuperAdminDashboardPage = lazy(() =>
  import("@/pages/dashboard/SuperAdminDashboardPage").then((module) => ({ default: module.SuperAdminDashboardPage })),
);
const UnitAdminDashboardPage = lazy(() =>
  import("@/pages/dashboard/UnitAdminDashboardPage").then((module) => ({ default: module.UnitAdminDashboardPage })),
);
const SubmittedSnapshotDashboardPage = lazy(() =>
  import("@/pages/dashboard/SubmittedSnapshotDashboardPage").then((module) => ({ default: module.SubmittedSnapshotDashboardPage })),
);
const FrameworkEditionSetupPage = lazy(() =>
  import("@/pages/masters/FrameworkEditionSetupPage").then((module) => ({ default: module.FrameworkEditionSetupPage })),
);
const IndicatorManagementPage = lazy(() =>
  import("@/pages/masters/IndicatorManagementPage").then((module) => ({ default: module.IndicatorManagementPage })),
);
const ReferenceMastersPage = lazy(() =>
  import("@/pages/masters/ReferenceMastersPage").then((module) => ({ default: module.ReferenceMastersPage })),
);
const DimensionsManagementPage = lazy(() =>
  import("@/pages/dimensions/DimensionsManagementPage").then((module) => ({ default: module.DimensionsManagementPage })),
);
const TemplateManagementPage = lazy(() =>
  import("@/pages/templates/TemplateManagementPage").then((module) => ({ default: module.TemplateManagementPage })),
);
const CollectionRequestPage = lazy(() =>
  import("@/pages/requests/CollectionRequestPage").then((module) => ({ default: module.CollectionRequestPage })),
);
const DepartmentDataEntryPage = lazy(() =>
  import("@/pages/data-entry/DepartmentDataEntryPage").then((module) => ({ default: module.DepartmentDataEntryPage })),
);
const ValidationQueuePage = lazy(() =>
  import("@/pages/validation/ValidationQueuePage").then((module) => ({ default: module.ValidationQueuePage })),
);
const ValidationRulesCatalogPage = lazy(() =>
  import("@/pages/validation/ValidationRulesCatalogPage").then((module) => ({ default: module.ValidationRulesCatalogPage })),
);
const ReviewApprovalPage = lazy(() =>
  import("@/pages/review/ReviewApprovalPage").then((module) => ({ default: module.ReviewApprovalPage })),
);
const IngestionReadbackPage = lazy(() =>
  import("@/pages/ingestion/IngestionReadbackPage").then((module) => ({ default: module.IngestionReadbackPage })),
);
const InvitationAccessPage = lazy(() =>
  import("@/pages/invitation-access/InvitationAccessPage").then((module) => ({ default: module.InvitationAccessPage })),
);
const TemporaryContributorSetupPage = lazy(() =>
  import("@/pages/invitation-access/TemporaryContributorSetupPage").then((module) => ({ default: module.TemporaryContributorSetupPage })),
);
const ApplicationSetupPage = lazy(() =>
  import("@/pages/application-setup/ApplicationSetupPage").then((module) => ({ default: module.ApplicationSetupPage })),
);
const LogsMonitorPage = lazy(() =>
  import("@/pages/logs-monitor/LogsMonitorPage").then((module) => ({ default: module.LogsMonitorPage })),
);
const AccessibilityCompliancePage = lazy(() =>
  import("@/pages/portal/AccessibilityCompliancePage").then((module) => ({ default: module.AccessibilityCompliancePage })),
);
const SystemObjectCoveragePage = lazy(() =>
  import("@/pages/portal/SystemObjectCoveragePage").then((module) => ({ default: module.SystemObjectCoveragePage })),
);
const ProfilePage = lazy(() =>
  import("@/pages/portal/ProfilePage").then((module) => ({ default: module.ProfilePage })),
);
const PasswordManagementPage = lazy(() =>
  import("@/pages/auth/PasswordManagementPage").then((module) => ({ default: module.PasswordManagementPage })),
);
const PreferencesPage = lazy(() =>
  import("@/pages/portal/PreferencesPage").then((module) => ({ default: module.PreferencesPage })),
);
const RemindersPage = lazy(() =>
  import("@/pages/portal/RemindersPage").then((module) => ({ default: module.RemindersPage })),
);
const NotificationsPage = lazy(() =>
  import("@/pages/portal/NotificationsPage").then((module) => ({ default: module.NotificationsPage })),
);

function RouteFallback() {
  return (
    <div className="grid h-dvh place-items-center bg-background text-sm font-semibold text-muted-foreground">
      Loading workspace...
    </div>
  );
}

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? "/dashboard/super-admin" : "/login"} replace />}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/invitation-setup" element={<TemporaryContributorSetupPage />} />
        <Route
          path="/dashboard/super-admin"
          element={
            <ProtectedRoute>
              <SuperAdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/unit-admin"
          element={
            <ProtectedRoute>
              <UnitAdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/snapshot"
          element={
            <ProtectedRoute>
              <SubmittedSnapshotDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/masters/frameworks"
          element={
            <ProtectedRoute>
              <FrameworkEditionSetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/masters/indicators"
          element={
            <ProtectedRoute>
              <IndicatorManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/masters/reference"
          element={
            <ProtectedRoute>
              <ReferenceMastersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dimensions"
          element={
            <ProtectedRoute>
              <DimensionsManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <TemplateManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <ProtectedRoute>
              <CollectionRequestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/data-entry"
          element={
            <ProtectedRoute>
              <DepartmentDataEntryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ingestion"
          element={
            <ProtectedRoute>
              <IngestionReadbackPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/validation"
          element={
            <ProtectedRoute>
              <ValidationQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/validation/rules"
          element={
            <ProtectedRoute>
              <ValidationRulesCatalogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/review"
          element={
            <ProtectedRoute>
              <ReviewApprovalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invitation-access"
          element={
            <ProtectedRoute>
              <InvitationAccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/application-setup"
          element={
            <ProtectedRoute>
              <ApplicationSetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logs-monitor"
          element={
            <ProtectedRoute>
              <LogsMonitorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accessibility-compliance"
          element={
            <ProtectedRoute>
              <AccessibilityCompliancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system-object-coverage"
          element={
            <ProtectedRoute>
              <SystemObjectCoveragePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/password-management"
          element={
            <ProtectedRoute>
              <PasswordManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/preferences"
          element={
            <ProtectedRoute>
              <PreferencesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reminders"
          element={
            <ProtectedRoute>
              <RemindersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard/super-admin" : "/login"} replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
