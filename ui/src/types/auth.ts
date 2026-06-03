export interface LoginRequest {
  login_identifier: string;
  password: string;
  unit_id?: string | null;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  auth_session_id: string;
  user_profile: Record<string, unknown>;
  roles: Record<string, unknown>[];
  permissions: Record<string, unknown>[];
  pages: Record<string, unknown>[];
  review_levels: Record<string, unknown>[];
}

export interface RefreshRequest {
  refresh_token: string;
  unit_id?: string | null;
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface AdminSetPasswordRequest {
  target_user_id: string;
  new_password: string;
}

export interface PermissionCheckRequest {
  permission_code: string;
  unit_id?: string | null;
}

export interface PermissionCheckResponse {
  allowed: boolean;
  permission_code: string;
  unit_id?: string | null;
}

export interface CurrentProfileResponse {
  user_profile: Record<string, unknown>;
  roles: Record<string, unknown>[];
  permissions: Record<string, unknown>[];
  pages: Record<string, unknown>[];
  review_levels: Record<string, unknown>[];
}

export interface PasswordUpdateResponse {
  password_updated: boolean;
}

export interface LogoutResponse {
  logged_out: boolean;
}

export interface AuthListResponse<T = Record<string, unknown>> {
  data: T[];
  count: number;
}

export interface AuthAdminUnit {
  unit_code: string;
  unit_name?: string | null;
  name?: string | null;
  unit_type?: string | null;
  parent_unit_code?: string | null;
  jurisdiction?: string | null;
  is_active?: boolean | null;
  status?: string | null;
}
