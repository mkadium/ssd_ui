import { apiClient } from "@/api/client";
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
    const res = await apiClient.post<LoginResponse>("/auth/login", body);
    return res.data;
  },

  refresh: async (body: RefreshRequest): Promise<RefreshResponse> => {
    const res = await apiClient.post<RefreshResponse>("/auth/refresh", body);
    return res.data;
  },

  logout: async (): Promise<LogoutResponse> => {
    const res = await apiClient.post<LogoutResponse>("/auth/logout");
    return res.data;
  },

  me: async (): Promise<CurrentProfileResponse> => {
    const res = await apiClient.get<CurrentProfileResponse>("/auth/me");
    return res.data;
  },

  changePassword: async (
    body: ChangePasswordRequest,
  ): Promise<PasswordUpdateResponse> => {
    const res = await apiClient.post<PasswordUpdateResponse>(
      "/auth/password/change",
      body,
    );
    return res.data;
  },

  adminSetPassword: async (
    body: AdminSetPasswordRequest,
  ): Promise<PasswordUpdateResponse> => {
    const res = await apiClient.post<PasswordUpdateResponse>(
      "/auth/admin/password/set",
      body,
    );
    return res.data;
  },

  checkPermission: async (
    body: PermissionCheckRequest,
  ): Promise<PermissionCheckResponse> => {
    const res = await apiClient.post<PermissionCheckResponse>(
      "/auth/permissions/check",
      body,
    );
    return res.data;
  },
};
