import { useCallback, useMemo, useState, type ReactNode } from "react";

import { setApiAccessToken } from "@/api/session";
import {
  AuthContext,
  type AuthContextValue,
  type AuthUser,
} from "@/providers/auth-context";
import type { LoginResponse } from "@/types/auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const setAuth = useCallback((data: LoginResponse) => {
    setAccessTokenState(data.access_token);
    setRefreshToken(data.refresh_token);
    setUser(data.user_profile);
    setApiAccessToken(data.access_token);
  }, []);

  const setAccessToken = useCallback((token: string) => {
    setAccessTokenState(token);
    setApiAccessToken(token);
  }, []);

  const clearAuth = useCallback(() => {
    setAccessTokenState(null);
    setRefreshToken(null);
    setUser(null);
    setApiAccessToken(null);
  }, []);

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
