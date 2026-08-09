import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/authStore';
import { ApiError } from '../services/api-client';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const result = await authService.login(email, password);
      if (result.user.role !== 'ADMIN') {
        throw new ApiError('Acceso denegado. Solo administradores pueden ingresar al panel.', 403);
      }
      return result;
    },
    onSuccess: (result) => setSession(result),
  });
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => clearSession(),
    onError: () => clearSession(), // si el token ya expiró, igual limpiamos la sesión local
  });
}

export function isAuthError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
