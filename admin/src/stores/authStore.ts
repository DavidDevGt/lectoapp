import { create } from 'zustand';
import { AuthUser } from '../types/api';

/**
 * Sesión del panel — SOLO en memoria.
 *
 * Antes este store usaba el middleware `persist`, que escribe en localStorage.
 * Ahí quedaban el access token y, peor, el refresh token de siete días,
 * legibles por cualquier JavaScript del origen: un solo XSS —o una dependencia
 * de npm comprometida— se llevaba la cuenta de administrador de forma
 * persistente.
 *
 * Ahora el refresh token vive en una cookie HttpOnly que este código no puede
 * leer, y el access token se pierde al recargar la página. La sesión se
 * rehidrata al arrancar pidiendo un token nuevo con la cookie (ver
 * useSessionBootstrap), no leyéndola de disco.
 */

/**
 * `status` existe porque la sesión ya no es visible de inmediato: al cargar la
 * página hay que preguntarle al servidor si la cookie sigue viva. Sin este
 * estado, las rutas protegidas verían `user === null` durante ese viaje y
 * mandarían al login a alguien que sí tiene sesión.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: AuthStatus;
  setSession: (session: { user: AuthUser; accessToken: string }) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
  setAnonymous: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  status: 'loading',
  setSession: ({ user, accessToken }) => set({ user, accessToken, status: 'authenticated' }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearSession: () => set({ user: null, accessToken: null, status: 'anonymous' }),
  setAnonymous: () => set({ user: null, accessToken: null, status: 'anonymous' }),
}));
