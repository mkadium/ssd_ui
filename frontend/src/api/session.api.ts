import { apiGet, apiPost } from "./http-client";

export type AuthRole = {
  role_code?: string;
  code?: string;
  role_name?: string;
  name?: string;
};

export type AuthProfile = {
  username?: string;
  email?: string;
  display_name?: string;
  displayName?: string;
  first_name?: string;
  last_name?: string;
  preferred_language_code?: string;
  owning_unit_code?: string;
  unit_code?: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  auth_session_id: string;
  user_profile: AuthProfile;
  roles: AuthRole[];
  permissions: Record<string, unknown>[];
  pages: Record<string, unknown>[];
  review_levels: Record<string, unknown>[];
};

export type CurrentProfileResponse = Pick<
  LoginResponse,
  "user_profile" | "roles" | "permissions" | "pages" | "review_levels"
>;

export type CurrentUser = {
  displayName: string;
  email: string;
  unitCode?: string;
  roles: string[];
};

export type UnitOption = {
  unit_code: string;
  unit_name?: string;
  name?: string;
  display_name?: string;
  is_active?: boolean;
};

const ACCESS_TOKEN_KEY = "ssd_access_token";
const REFRESH_TOKEN_KEY = "ssd_refresh_token";
const CURRENT_USER_KEY = "ssd_current_user";
const LAST_ACTIVITY_KEY = "ssd_last_activity_at";
const SELECTED_UNIT_CODE_KEY = "ssd_selected_unit_code";
const SELECTED_LOCALE_KEY = "ssd_selected_locale";
export const AUTH_EXPIRED_EVENT = "ssd-auth-expired";
export const UNIT_CHANGED_EVENT = "ssd-unit-changed";
export const LOCALE_CHANGED_EVENT = "ssd-locale-changed";
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const DEFAULT_UNIT_CODE = "SDG";
export const DEFAULT_LOCALE = "en-IN";

export async function login(loginIdentifier: string, password: string): Promise<LoginResponse> {
  const result = await apiPost<LoginResponse, { login_identifier: string; password: string }>("/auth/login", {
    login_identifier: loginIdentifier,
    password,
  });

  storeAuthSession(result.data);
  return result.data;
}

export async function loadCurrentUser(): Promise<CurrentUser> {
  const result = await apiGet<CurrentProfileResponse>("/auth/me");
  const currentUser = mapCurrentUser(result.data);
  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
  return currentUser;
}

export function getLocalCurrentUser(): CurrentUser {
  const stored = window.localStorage.getItem(CURRENT_USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as CurrentUser;
    } catch {
      clearAuthSession();
    }
  }

  return {
    displayName: "SSD Admin",
    email: "ssd.admin@mospi.gov.in",
    unitCode: DEFAULT_UNIT_CODE,
    roles: ["SUPER_ADMIN"],
  };
}

export function isSuperAdmin(user: CurrentUser): boolean {
  return user.roles.some((role) => ["SUPER_ADMIN", "SUPERADMIN"].includes(role.toUpperCase()));
}

export function getSelectedUnitCode(): string {
  return (
    window.localStorage.getItem(SELECTED_UNIT_CODE_KEY) ||
    getLocalCurrentUser().unitCode ||
    DEFAULT_UNIT_CODE
  )
    .trim()
    .toUpperCase();
}

export function setSelectedUnitCode(unitCode: string): void {
  const normalizedUnitCode = (unitCode || DEFAULT_UNIT_CODE).trim().toUpperCase();
  window.localStorage.setItem(SELECTED_UNIT_CODE_KEY, normalizedUnitCode);
  window.dispatchEvent(new CustomEvent(UNIT_CHANGED_EVENT, { detail: { unitCode: normalizedUnitCode } }));
}

export function getSelectedLocale(): string {
  return window.localStorage.getItem(SELECTED_LOCALE_KEY) || DEFAULT_LOCALE;
}

export function setSelectedLocale(locale: string): void {
  const normalizedLocale = locale || DEFAULT_LOCALE;
  window.localStorage.setItem(SELECTED_LOCALE_KEY, normalizedLocale);
  window.dispatchEvent(new CustomEvent(LOCALE_CHANGED_EVENT, { detail: { locale: normalizedLocale } }));
}

export async function listAvailableUnits(): Promise<UnitOption[]> {
  const result = await apiGet<{ data: UnitOption[]; count: number }>("/auth/admin/units?include_inactive=false&locale=en-IN");
  return result.data.data.filter((unit) => unit.unit_code);
}

export function hasActiveSession(): boolean {
  return Boolean(window.localStorage.getItem(ACCESS_TOKEN_KEY));
}

export function markSessionActivity(): void {
  window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

export function isSessionIdleExpired(): boolean {
  const lastActivity = Number(window.localStorage.getItem(LAST_ACTIVITY_KEY) ?? Date.now());
  return Date.now() - lastActivity > IDLE_TIMEOUT_MS;
}

export function getPostLoginPath(roles: string[]): string {
  const normalizedRoles = roles.map((role) => role.toUpperCase());
  if (normalizedRoles.includes("SUPER_ADMIN") || normalizedRoles.includes("SUPERADMIN")) {
    return "/";
  }
  if (normalizedRoles.includes("UNIT_ADMIN") || normalizedRoles.includes("UNITADMIN")) {
    return "/dashboard/unit";
  }
  return "/";
}

export async function logout(): Promise<void> {
  try {
    await apiPost<{ logged_out: boolean }, Record<string, never>>("/auth/logout", {});
  } finally {
    clearAuthSession();
  }
}

function storeAuthSession(response: LoginResponse): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(mapCurrentUser(response)));
  markSessionActivity();
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(CURRENT_USER_KEY);
  window.localStorage.removeItem(LAST_ACTIVITY_KEY);
  window.localStorage.removeItem(SELECTED_UNIT_CODE_KEY);
  window.localStorage.removeItem(SELECTED_LOCALE_KEY);
}

function mapCurrentUser(response: CurrentProfileResponse): CurrentUser {
  const profile = response.user_profile ?? {};
  const displayName =
    profile.display_name ??
    profile.displayName ??
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ??
    profile.username ??
    "SSD User";

  return {
    displayName,
    email: profile.email ?? "",
    unitCode: profile.owning_unit_code ?? profile.unit_code,
    roles: response.roles.map((role) => role.role_code ?? role.code ?? role.role_name ?? role.name ?? "USER"),
  };
}
