import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "../layouts/app-shell";
import { AccessManagementPage } from "../pages/auth/access-management-page";
import { AuditSessionsPage } from "../pages/auth/audit-sessions-page";
import { LoginPage } from "../pages/auth/login-page";
import { ReviewWorkflowPage } from "../pages/auth/review-workflow-page";
import { UnitAccessPage } from "../pages/auth/unit-access-page";
import { UserAdministrationPage } from "../pages/auth/user-administration-page";
import { DataFieldLibraryPage } from "../pages/data-fields/data-field-library-page";
import { DimensionLibraryPage } from "../pages/dimensions/dimension-library-page";
import { GeographyPage } from "../pages/dimensions/geography-page";
import { TimePeriodsPage } from "../pages/dimensions/time-periods-page";
import { FrameworkLevelPage } from "../pages/framework/framework-level-page";
import { FrameworkPage } from "../pages/framework/framework-page";
import { GlobalIndicatorsPage } from "../pages/indicators/global-indicators-page";
import { IndicatorLibraryPage } from "../pages/indicators/indicator-library-page";
import { MastersReferencePage } from "../pages/masters/masters-reference-page";
import { PlaceholderPage } from "../pages/system/placeholder-page";
import { TemplateLibraryPage } from "../pages/templates/template-library-page";
import { TemplateStudioPage } from "../pages/templates/template-studio-page";
import { flatNavigation } from "./navigation";

const childRoutes = flatNavigation
  .filter((item) => item.path !== "/login")
  .map((item) =>
    item.path === "/"
      ? {
          index: true,
          element: <PlaceholderPage moduleName={item.label} />,
        }
      : {
          path: item.path.replace(/^\//, ""),
          element:
            item.path === "/framework" ? (
              <FrameworkPage />
            ) : item.path.startsWith("/masters/") ? (
              <MastersReferencePage />
            ) : item.path === "/indicators/library" ? (
              <IndicatorLibraryPage />
            ) : item.path === "/indicators/global" ? (
              <GlobalIndicatorsPage />
            ) : item.path === "/dimensions/library" ? (
              <DimensionLibraryPage />
            ) : item.path === "/dimensions/geography" ? (
              <GeographyPage />
            ) : item.path === "/dimensions/time-periods" ? (
              <TimePeriodsPage />
            ) : item.path === "/data-fields/library" ? (
              <DataFieldLibraryPage />
            ) : item.path === "/template/library" ? (
              <TemplateLibraryPage />
            ) : item.path === "/authentication/access-catalog" || item.path === "/authentication/permission-matrix" ? (
              <AccessManagementPage />
            ) : item.path === "/authentication/users" ? (
              <UserAdministrationPage />
            ) : item.path === "/authentication/units" ? (
              <UnitAccessPage />
            ) : item.path === "/authentication/review-workflow" ? (
              <ReviewWorkflowPage />
            ) : item.path === "/authentication/audit-sessions" ? (
              <AuditSessionsPage />
            ) : (
              <PlaceholderPage moduleName={item.label} />
            ),
        },
  );

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <AppShell />,
    children: [
      ...childRoutes,
      {
        path: "framework/levels/:levelCode",
        element: <FrameworkLevelPage />,
      },
      {
        path: "framework/levels/:levelCode/:nodeCode",
        element: <FrameworkLevelPage />,
      },
      {
        path: "template/studio",
        element: <TemplateStudioPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
