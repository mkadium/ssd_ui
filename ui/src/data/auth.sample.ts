import type { LoginResponse } from "@/types/auth";

const baseAuthSession = {
  token_type: "bearer",
  auth_session_id: "demo-auth-session",
  refresh_token: "demo-refresh-token",
  review_levels: [],
};

export const demoSuperAdminLogin: LoginResponse = {
  ...baseAuthSession,
  access_token: "demo-super-admin-access-token",
  user_profile: {
    user_code: "USR_SUPER_ADMIN_DEMO",
    display_name: "SSD Super Admin",
    default_unit_code: "MOSPI",
    preferred_locale: "en-IN",
  },
  roles: [
    {
      role_code: "SUPER_ADMIN",
      role_name: "Super Admin",
    },
  ],
  permissions: [
    { permission_code: "DASHBOARD:view" },
    { permission_code: "MASTERS:view" },
    { permission_code: "REQUESTS:view" },
    { permission_code: "VALIDATION:view" },
  ],
  pages: [
    { page_code: "DASHBOARD_SUPER_ADMIN", route_path: "/dashboard/super-admin" },
    { page_code: "DASHBOARD_UNIT_ADMIN", route_path: "/dashboard/unit-admin" },
  ],
};

export const demoUnitAdminLogin: LoginResponse = {
  ...baseAuthSession,
  access_token: "demo-unit-admin-access-token",
  user_profile: {
    user_code: "USR_UNIT_ADMIN_DEMO",
    display_name: "SSD Unit Admin",
    default_unit_code: "SSD_DEMO_SOURCE",
    preferred_locale: "en-IN",
  },
  roles: [
    {
      role_code: "UNIT_ADMIN",
      role_name: "Unit Admin",
    },
  ],
  permissions: [
    { permission_code: "DASHBOARD:view" },
    { permission_code: "REQUESTS:view" },
    { permission_code: "INGESTION:view" },
    { permission_code: "VALIDATION:view" },
  ],
  pages: [{ page_code: "DASHBOARD_UNIT_ADMIN", route_path: "/dashboard/unit-admin" }],
};
