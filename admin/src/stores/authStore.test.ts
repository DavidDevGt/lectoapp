import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Resetear el store a su estado inicial antes de cada test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
    });
  });

  describe('setSession', () => {
    it('debería guardar user, accessToken y refreshToken', () => {
      const session = {
        user: {
          id: 'u1',
          name: 'Admin',
          email: 'admin@test.com',
          role: 'ADMIN' as const,
          currentLevel: 'BEGINNER' as const,
          totalPoints: 0,
          streak: 0,
        },
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      };

      useAuthStore.getState().setSession(session);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(session.user);
      expect(state.accessToken).toBe('access-token-123');
      expect(state.refreshToken).toBe('refresh-token-456');
    });
  });

  describe('setAccessToken', () => {
    it('debería actualizar solo el accessToken sin tocar user ni refreshToken', () => {
      // Primero, seteamos una sesión completa
      useAuthStore.getState().setSession({
        user: {
          id: 'u1',
          name: 'Admin',
          email: 'admin@test.com',
          role: 'ADMIN' as const,
          currentLevel: 'BEGINNER' as const,
          totalPoints: 100,
          streak: 5,
        },
        accessToken: 'old-access',
        refreshToken: 'refresh-token',
      });

      // Actualizamos solo el access token (como después de un refresh)
      useAuthStore.getState().setAccessToken('new-access');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-access');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.user?.name).toBe('Admin');
    });
  });

  describe('clearSession', () => {
    it('debería limpiar todo el estado a null', () => {
      // Primero, seteamos una sesión completa
      useAuthStore.getState().setSession({
        user: {
          id: 'u1',
          name: 'Admin',
          email: 'admin@test.com',
          role: 'ADMIN' as const,
          currentLevel: 'BEGINNER' as const,
          totalPoints: 0,
          streak: 0,
        },
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      // Limpiamos
      useAuthStore.getState().clearSession();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });
  });

  describe('estado inicial', () => {
    it('debería empezar con todo en null', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });
  });
});
