import { useAuthStore } from "@/stores/useAuthStore";

export function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const user = useAuthStore((state) => state.user);

  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated: !!accessToken,
  };
}
