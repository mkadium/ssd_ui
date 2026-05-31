import { apiRequest } from "@/api/client";
import type {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  ChangePasswordRequest,
  AdminSetPasswordRequest,
  PermissionCheckRequest,
  PermissionCheckResponse,
  CurrentProfileResponse,
  PasswordUpdateResponse,
  LogoutResponse,
} from "@/types/auth";

export const authService = {
  login: async (body: LoginRequest): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      auth: false,
      json: body,
    });
  },

  refresh: async (body: RefreshRequest): Promise<RefreshResponse> => {
    return apiRequest<RefreshResponse>("/auth/refresh", {
      method: "POST",
      auth: false,
      json: body,
    });
  },

  logout: async (): Promise<LogoutResponse> => {
    return apiRequest<LogoutResponse>("/auth/logout", {
      method: "POST",
    });
  },

  me: async (): Promise<CurrentProfileResponse> => {
    return apiRequest<CurrentProfileResponse>("/auth/me");
  },

  changePassword: async (
    body: ChangePasswordRequest,
  ): Promise<PasswordUpdateResponse> => {
    return apiRequest<PasswordUpdateResponse>("/auth/password/change", {
      method: "POST",
      json: body,
    });
  },

  adminSetPassword: async (
    body: AdminSetPasswordRequest,
  ): Promise<PasswordUpdateResponse> => {
    return apiRequest<PasswordUpdateResponse>("/auth/admin/password/set", {
      method: "POST",
      json: body,
    });
  },

  checkPermission: async (
    body: PermissionCheckRequest,
  ): Promise<PermissionCheckResponse> => {
    return apiRequest<PermissionCheckResponse>("/auth/permissions/check", {
      method: "POST",
      json: body,
    });
  },
};
