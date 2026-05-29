import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LoginResponse } from "@/types/auth";

type AuthStore = {
  accessToken: string | null;
  refreshToken: string | null;
  user: LoginResponse["user_profile"] | null;
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
      setAuth: (data) =>
        set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          user: data.user_profile,
        }),
      setAccessToken: (token) => set({ accessToken: token }),
      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
