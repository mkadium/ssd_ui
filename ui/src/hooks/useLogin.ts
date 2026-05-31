import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";

export function useLogin() {
  const { setAuth } = useAuth();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => setAuth(data),
  });
}
