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
  const setAuth = useAuthStore((state) => state.setAuth);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: Boolean(accessToken),
      setAuth,
      setAccessToken,
      clearAuth,
    }),
    [accessToken, clearAuth, refreshToken, setAccessToken, setAuth, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
