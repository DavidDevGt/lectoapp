import { apiRequest, refreshAccessToken } from './api-client';
import { useAuthStore } from '../stores/authStore';
import { AuthResult, AuthUser } from '../types/api';

/** Forma de GET /api/users/me — superconjunto de AuthUser. */
interface UserProfile extends AuthUser {
  avatarUrl: string | null;
  gradeLevel: string | null;
  createdAt: string;
}

export const authService = {
  login: (email: string, password: string) =>
    apiRequest<AuthResult>('/auth/login', { method: 'POST', body: { email, password } }),

  logout: () => apiRequest<null>('/auth/logout', { method: 'POST' }),

  me: () => apiRequest<UserProfile>('/users/me'),
};

/**
 * Recupera la sesión al cargar la página.
 *
 * El access token ya no sobrevive a un refresco del navegador —vive solo en
 * memoria— y el refresh token es una cookie HttpOnly que este código no puede
 * leer. Así que la única forma de saber si hay sesión es preguntárselo al
 * servidor: se pide un token nuevo (la cookie viaja sola) y, si llega, se
 * recupera el perfil.
 *
 * Nunca lanza: cualquier fallo significa "no hay sesión" y termina en la
 * pantalla de login.
 */
export async function bootstrapSession(): Promise<void> {
  const { setSession, setAnonymous } = useAuthStore.getState();

  try {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      setAnonymous();
      return;
    }

    const profile = await authService.me();

    // El panel es solo para administradores. Una cuenta de estudiante con
    // cookie válida no debe rehidratar sesión aquí.
    if (profile.role !== 'ADMIN') {
      setAnonymous();
      return;
    }

    setSession({
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        currentLevel: profile.currentLevel,
        totalPoints: profile.totalPoints,
        streak: profile.streak,
      },
      accessToken: useAuthStore.getState().accessToken as string,
    });
  } catch {
    setAnonymous();
  }
}
