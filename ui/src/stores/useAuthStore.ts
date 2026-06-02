import { create } from "zustand";
import { persist } from "zustand/middleware";

import { setApiAccessToken } from "@/api/session";
import type { LoginResponse } from "@/types/auth";

type AuthStore = {
  accessToken: string | null;
  refreshToken: string | null;
  user: LoginResponse["user_profile"] | null;
  roles: LoginResponse["roles"];
  pages: LoginResponse["pages"];
  setAuth: (data: LoginResponse) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      roles: [],
      pages: [],
      setAuth: (data) =>
        set(() => {
          setApiAccessToken(data.access_token);

          return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            user: data.user_profile,
            roles: data.roles,
            pages: data.pages,
          };
        }),
      setAccessToken: (token) =>
        set(() => {
          setApiAccessToken(token);

          return { accessToken: token };
        }),
      clearAuth: () =>
        set(() => {
          setApiAccessToken(null);

          return { accessToken: null, refreshToken: null, user: null, roles: [], pages: [] };
        }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        roles: state.roles,
        pages: state.pages,
      }),
      onRehydrateStorage: () => (state) => {
        setApiAccessToken(state?.accessToken ?? null);
      },
    },
  ),
);
