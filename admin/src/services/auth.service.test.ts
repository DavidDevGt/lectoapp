import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../stores/authStore';

/**
 * Rehidratación de la sesión al cargar la página.
 *
 * El access token ya no sobrevive a un refresco del navegador —vive solo en
 * memoria— y el refresh token es una cookie HttpOnly ilegible desde aquí. La
 * única forma de saber si hay sesión es pedirle al servidor un token nuevo y,
 * si llega, recuperar el perfil.
 */

const mocks = vi.hoisted(() => ({
  refreshAccessToken: vi.fn(),
  apiRequest: vi.fn(),
}));

vi.mock('./api-client', () => ({
  refreshAccessToken: mocks.refreshAccessToken,
  apiRequest: mocks.apiRequest,
  ApiError: class ApiError extends Error {},
}));

const { bootstrapSession } = await import('./auth.service');

const adminProfile = {
  id: 'u1',
  name: 'Giovanni',
  email: 'giovanni@ejemplo.com',
  role: 'ADMIN' as const,
  avatarUrl: null,
  gradeLevel: null,
  currentLevel: 'BEGINNER' as const,
  totalPoints: 0,
  streak: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
};

/** El refresh real deja el token en el store; el doble hace lo mismo. */
function refreshSucceeds() {
  mocks.refreshAccessToken.mockImplementation(async () => {
    useAuthStore.getState().setAccessToken('access-rehidratado');
    return true;
  });
}

describe('bootstrapSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, accessToken: null, status: 'loading' });
  });

  it('recupera la sesión cuando la cookie sigue viva', async () => {
    refreshSucceeds();
    mocks.apiRequest.mockResolvedValue(adminProfile);

    await bootstrapSession();

    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.user?.email).toBe('giovanni@ejemplo.com');
    expect(state.accessToken).toBe('access-rehidratado');
  });

  it('consulta el perfil en /users/me', async () => {
    refreshSucceeds();
    mocks.apiRequest.mockResolvedValue(adminProfile);

    await bootstrapSession();

    expect(mocks.apiRequest).toHaveBeenCalledWith('/users/me');
  });

  it('queda anónimo cuando no hay cookie válida', async () => {
    mocks.refreshAccessToken.mockResolvedValue(false);

    await bootstrapSession();

    const state = useAuthStore.getState();
    expect(state.status).toBe('anonymous');
    expect(state.user).toBeNull();
    expect(mocks.apiRequest).not.toHaveBeenCalled();
  });

  /**
   * El panel es solo para administradores. Una cuenta de estudiante con cookie
   * válida —la app móvil usa el mismo backend— no debe rehidratar sesión aquí.
   */
  it('rechaza a un STUDENT aunque su cookie sea válida', async () => {
    refreshSucceeds();
    mocks.apiRequest.mockResolvedValue({ ...adminProfile, role: 'STUDENT' });

    await bootstrapSession();

    const state = useAuthStore.getState();
    expect(state.status).toBe('anonymous');
    expect(state.user).toBeNull();
  });

  it('queda anónimo si falla la consulta del perfil, sin propagar el error', async () => {
    refreshSucceeds();
    mocks.apiRequest.mockRejectedValue(new Error('red caída'));

    await expect(bootstrapSession()).resolves.toBeUndefined();
    expect(useAuthStore.getState().status).toBe('anonymous');
  });

  it('nunca deja el estado en loading', async () => {
    mocks.refreshAccessToken.mockRejectedValue(new Error('fallo inesperado'));

    await bootstrapSession();

    // Si quedara en 'loading', las rutas protegidas mostrarían el spinner para
    // siempre y el panel sería inusable.
    expect(useAuthStore.getState().status).toBe('anonymous');
  });
});
