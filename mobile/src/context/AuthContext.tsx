import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User } from '../types/api';
import { apiClient } from '../api/client';
import { tokenStore } from '../api/tokenStore';

interface AuthContextValue {
  user: User | null;
  /** true mientras se restaura la sesión persistida al arrancar. */
  isBootstrapping: boolean;
  isLoggingIn: boolean;
  isRegistering: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, gradeLevel?: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Refleja en la UI los totales que devolvió el servidor. Nunca calcula puntos localmente. */
  applyServerTotals: (totals: {
    totalPoints: number;
    streak?: number;
    currentLevel?: string;
  }) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const clearSession = useCallback(async () => {
    setUser(null);
    apiClient.setSession(null);
    await tokenStore.clear();
  }, []);

  // Restaura la sesión guardada. Si el refresh token murió, la primera petición
  // autenticada dispara onSessionExpired y volvemos al login.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [stored, cachedUser] = await Promise.all([tokenStore.load(), tokenStore.loadUser()]);
        if (!stored || !cachedUser) return;

        apiClient.setSession(stored);

        // /progress/me confirma que el token sirve y trae los totales frescos;
        // del cache solo conservamos identidad (id, nombre, correo, rol).
        const progress = await apiClient.getMyProgress();
        if (cancelled) return;

        setUser({
          ...cachedUser,
          totalPoints: progress.totalPoints,
          streak: progress.streak,
          currentLevel: progress.currentLevel,
        });
      } catch {
        // Token inservible o backend caído: arrancamos deslogueados, sin ruido.
        await tokenStore.clear();
        apiClient.setSession(null);
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Un refresh token rechazado debe cerrar sesión en la UI, no dejarla en un limbo.
  useEffect(() => {
    apiClient.onSessionExpired(() => {
      void clearSession();
    });
    return () => apiClient.onSessionExpired(null);
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoggingIn(true);
    try {
      const session = await apiClient.login(email, password);
      apiClient.setSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
      await Promise.all([
        tokenStore.save({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        }),
        tokenStore.saveUser(session.user),
      ]);
      setUser(session.user);
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, gradeLevel?: string) => {
      setIsRegistering(true);
      try {
        const session = await apiClient.register(name, email, password, gradeLevel);
        apiClient.setSession({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        });
        await Promise.all([
          tokenStore.save({
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
          }),
          tokenStore.saveUser(session.user),
        ]);
        setUser(session.user);
      } finally {
        setIsRegistering(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch {
      // Cerrar sesión local siempre procede, aunque el servidor no conteste.
    }
    await clearSession();
  }, [clearSession]);

  const applyServerTotals = useCallback(
    (totals: { totalPoints: number; streak?: number; currentLevel?: string }) => {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              totalPoints: totals.totalPoints,
              streak: totals.streak ?? prev.streak,
              currentLevel: (totals.currentLevel as User['currentLevel']) ?? prev.currentLevel,
            }
          : prev,
      );
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, isBootstrapping, isLoggingIn, isRegistering, login, register, logout, applyServerTotals }),
    [user, isBootstrapping, isLoggingIn, isRegistering, login, register, logout, applyServerTotals],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
