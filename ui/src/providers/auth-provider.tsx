import { useMemo, type ReactNode } from "react";

import {
  AuthContext,
  type AuthContextValue,
} from "@/providers/auth-context";
import { useAuthStore } from "@/stores/useAuthStore";

export function AuthProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const user = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);
  const pages = useAuthStore((state) => state.pages);
  const setAuth = useAuthStore((state) => state.setAuth);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      refreshToken,
      user,
      roles,
      pages,
      isAuthenticated: Boolean(accessToken),
      setAuth,
      setAccessToken,
      clearAuth,
    }),
    [accessToken, clearAuth, pages, refreshToken, roles, setAccessToken, setAuth, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
