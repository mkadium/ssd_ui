import { createContext } from "react";

import type { LoginResponse } from "@/types/auth";

export type AuthUser = LoginResponse["user_profile"];

export type AuthContextValue = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  roles: LoginResponse["roles"];
  pages: LoginResponse["pages"];
  isAuthenticated: boolean;
  setAuth: (data: LoginResponse) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
