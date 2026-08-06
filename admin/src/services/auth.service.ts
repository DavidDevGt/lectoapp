import { apiRequest } from './api-client';
import { AuthResult } from '../types/api';

export const authService = {
  login: (email: string, password: string) =>
    apiRequest<AuthResult>('/auth/login', { method: 'POST', body: { email, password } }),

  logout: () => apiRequest<null>('/auth/logout', { method: 'POST' }),
};
