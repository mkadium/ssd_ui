import type { LoginResponse } from "@/types/auth";

type AuthRole = LoginResponse["roles"][number];
type AuthPage = LoginResponse["pages"][number];

const roleDashboardMap: Record<string, string> = {
  SUPER_ADMIN: "/dashboard/super-admin",
  SYSTEM_ADMIN: "/dashboard/super-admin",
  UNIT_ADMIN: "/dashboard/unit-admin",
  UNIT_REQUEST_ADMIN: "/dashboard/unit-admin",
  UNIT_TEMPLATE_ADMIN: "/dashboard/unit-admin",
  VALIDATION_OFFICER: "/dashboard/unit-admin",
  REVIEWER: "/dashboard/unit-admin",
  INGESTION_ADMIN: "/dashboard/unit-admin",
  REQUEST_ACCESS_ADMIN: "/dashboard/unit-admin",
  DASHBOARD_PUBLISHER: "/dashboard/snapshot",
  DASHBOARD_ADMIN: "/dashboard/snapshot",
  SNAPSHOT_PUBLISHER: "/dashboard/snapshot",
  PUBLIC_DASHBOARD_ADMIN: "/dashboard/snapshot",
};

const pageDashboardMap: Record<string, string> = {
  DASHBOARD_SUPER_ADMIN: "/dashboard/super-admin",
  DASHBOARD_UNIT_ADMIN: "/dashboard/unit-admin",
  DASHBOARD_SNAPSHOT: "/dashboard/snapshot",
};

const dashboardRoutes = new Set([
  "/dashboard/super-admin",
  "/dashboard/unit-admin",
  "/dashboard/snapshot",
]);

const authenticatedUtilityRoutes = new Set([
  "/profile",
  "/preferences",
  "/password-management",
  "/reminders",
  "/notifications",
]);

function readStableCode(item: AuthRole | AuthPage, key: "role_code" | "page_code") {
  const value = item[key];

  return typeof value === "string" ? value.toUpperCase() : "";
}

function normalizePath(path: string) {
  if (path === "/") {
    return path;
  }

  return path.replace(/\/+$/, "");
}

function readRoutePath(page: AuthPage) {
  const routePath = page.route_path;

  return typeof routePath === "string" ? normalizePath(routePath) : "";
}

function hasPrivilegedAdminRole(roles: AuthRole[]) {
  return roles.some((role) => {
    const roleCode = readStableCode(role, "role_code");

    return roleCode === "SUPER_ADMIN" || roleCode === "SYSTEM_ADMIN";
  });
}

function routeMatchesPagePath(pathname: string, routePath: string) {
  if (!routePath || routePath === "/") {
    return false;
  }

  return pathname === routePath || pathname.startsWith(`${routePath}/`);
}

export function getDefaultDashboardPath({
  roles,
  pages,
}: Pick<LoginResponse, "roles" | "pages">) {
  const roleCodes = roles.map((role) => readStableCode(role, "role_code"));

  for (const roleCode of roleCodes) {
    const mappedDashboard = roleDashboardMap[roleCode];

    if (mappedDashboard) {
      return mappedDashboard;
    }
  }

  const fallbackRoleCode = roleCodes.find(Boolean);

  if (fallbackRoleCode?.includes("SUPER")) {
    return "/dashboard/super-admin";
  }

  if (
    fallbackRoleCode?.includes("UNIT") ||
    fallbackRoleCode?.includes("REVIEW") ||
    fallbackRoleCode?.includes("VALIDATION") ||
    fallbackRoleCode?.includes("INGESTION") ||
    fallbackRoleCode?.includes("REQUEST")
  ) {
    return "/dashboard/unit-admin";
  }

  if (
    fallbackRoleCode?.includes("DASHBOARD") ||
    fallbackRoleCode?.includes("SNAPSHOT") ||
    fallbackRoleCode?.includes("PUBLISH")
  ) {
    return "/dashboard/snapshot";
  }

  for (const page of pages) {
    const mappedDashboard = pageDashboardMap[readStableCode(page, "page_code")];

    if (mappedDashboard) {
      return mappedDashboard;
    }

    const routePath = readRoutePath(page);

    if (dashboardRoutes.has(routePath)) {
      return routePath;
    }
  }

  return "/dashboard/super-admin";
}

export function canAccessRoute(
  pathname: string,
  authContext: Pick<LoginResponse, "roles" | "pages">,
) {
  const normalizedPathname = normalizePath(pathname);

  if (hasPrivilegedAdminRole(authContext.roles)) {
    return true;
  }

  if (authenticatedUtilityRoutes.has(normalizedPathname)) {
    return true;
  }

  const defaultDashboardPath = getDefaultDashboardPath(authContext);

  if (normalizedPathname === defaultDashboardPath) {
    return true;
  }

  if (normalizedPathname.startsWith("/dashboard/")) {
    return false;
  }

  return authContext.pages.some((page) =>
    routeMatchesPagePath(normalizedPathname, readRoutePath(page)),
  );
}
