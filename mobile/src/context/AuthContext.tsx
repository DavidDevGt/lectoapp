import React, { createContext, useContext, useState } from 'react';
import { User } from '../types/api';
import { apiClient } from '../api/client';
import { MOCK_STUDENT } from '../api/mockData';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  addPoints: (earnedPoints: number, newStreak?: number) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: false,
  login: async () => false,
  logout: () => {},
  addPoints: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(MOCK_STUDENT);
  const [token, setToken] = useState<string | null>('mock-session-token');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.login(email, pass);
      setUser(res.user);
      setToken(res.token);
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    apiClient.setToken(null);
  };

  const addPoints = (earnedPoints: number, newStreak?: number) => {
    if (!user) return;
    setUser({
      ...user,
      totalPoints: user.totalPoints + earnedPoints,
      streak: newStreak !== undefined ? newStreak : user.streak,
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, addPoints }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
