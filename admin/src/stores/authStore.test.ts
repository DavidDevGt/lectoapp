import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

const adminUser = {
  id: 'u1',
  name: 'Admin',
  email: 'admin@test.com',
  role: 'ADMIN' as const,
  currentLevel: 'BEGINNER' as const,
  totalPoints: 0,
  streak: 0,
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, status: 'loading' });
  });

  describe('setSession', () => {
    it('debería guardar user y accessToken y marcar la sesión autenticada', () => {
      useAuthStore.getState().setSession({ user: adminUser, accessToken: 'access-token-123' });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(adminUser);
      expect(state.accessToken).toBe('access-token-123');
      expect(state.status).toBe('authenticated');
    });
  });

  describe('setAccessToken', () => {
    it('debería actualizar solo el accessToken sin tocar user', () => {
      useAuthStore.getState().setSession({ user: adminUser, accessToken: 'old-access' });

      useAuthStore.getState().setAccessToken('new-access');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-access');
      expect(state.user?.name).toBe('Admin');
      expect(state.status).toBe('authenticated');
    });
  });

  describe('clearSession', () => {
    it('debería limpiar la sesión y dejar el estado en anonymous', () => {
      useAuthStore.getState().setSession({ user: adminUser, accessToken: 'access' });

      useAuthStore.getState().clearSession();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.status).toBe('anonymous');
    });
  });

  describe('persistencia', () => {
    /**
     * El refresh token vive en una cookie HttpOnly y el access token solo en
     * memoria. Este test es el guardia contra una regresión concreta: volver a
     * envolver el store en el middleware `persist` de zustand devolvería la
     * sesión a localStorage, donde cualquier XSS puede leerla.
     */
    it('no debería escribir la sesión en localStorage', () => {
      useAuthStore.getState().setSession({ user: adminUser, accessToken: 'secreto' });

      const stored = Object.keys(localStorage).map((key) => localStorage.getItem(key) ?? '');

      expect(stored.some((value) => value.includes('secreto'))).toBe(false);
      expect(localStorage.getItem('lectoapp-admin-auth')).toBeNull();
    });

    it('no debería exponer un refreshToken en el estado', () => {
      useAuthStore.getState().setSession({ user: adminUser, accessToken: 'access' });

      expect(useAuthStore.getState()).not.toHaveProperty('refreshToken');
    });
  });
});
