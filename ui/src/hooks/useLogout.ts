import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";

export function useLogout() {
  const { clearAuth } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
    },
  });
}
