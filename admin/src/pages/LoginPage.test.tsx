import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage } from './LoginPage';
import { renderWithProviders } from '../test/renderWithProviders';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/authStore';
import { buildAuthResult, buildAuthUser } from '../test/fixtures';

vi.mock('../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearSession();
  });

  it('debe renderear los campos del formulario de inicio de sesión', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ingresar/i })).toBeInTheDocument();
  });

  it('debe denegar el acceso a usuarios STUDENT y mostrar mensaje de error sin modificar authStore', async () => {
    vi.mocked(authService.login).mockResolvedValueOnce(
      buildAuthResult({
        user: buildAuthUser({
          id: 'student-1',
          name: 'Estudiante',
          email: 'student@example.com',
          role: 'STUDENT',
        }),
        accessToken: 'token-student',

      }),
    );

    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'student@example.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText(/Acceso denegado/i)).toBeInTheDocument();
    });

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('debe permitir el acceso a usuarios ADMIN y guardar la sesión', async () => {
    vi.mocked(authService.login).mockResolvedValueOnce(
      buildAuthResult({
        user: buildAuthUser({ id: 'admin-1', role: 'ADMIN' }),
        accessToken: 'token-admin',

      }),
    );

    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().user?.role).toBe('ADMIN');
    });
  });
});
