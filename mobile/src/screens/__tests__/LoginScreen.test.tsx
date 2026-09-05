import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
// Importacion estatica para que Jest (sin vm-modules) pueda usarla
import { ApiError } from '../../api/errors';

const mockLogin = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoggingIn: false,
    isRegistering: false,
    user: null,
    isBootstrapping: false,
    register: jest.fn(),
    logout: jest.fn(),
    applyServerTotals: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// eslint-disable-next-line import/first
import { LoginScreen } from '../LoginScreen';

const navigation = { navigate: mockNavigate } as never;
const route = { key: 'Login', name: 'Login' } as never;

describe('LoginScreen', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
  });

  it('renderiza el titulo principal y el boton de inicio de sesion', () => {
    const { getByText, getByRole } = render(<LoginScreen navigation={navigation} route={route} />);
    expect(getByText('LectoApp')).toBeTruthy();
    expect(getByRole('button', { name: 'Iniciar sesión en LectoApp' })).toBeTruthy();
  });

  it('muestra error al intentar enviar con campos vacios', async () => {
    const { getByRole, getByText } = render(<LoginScreen navigation={navigation} route={route} />);
    fireEvent.press(getByRole('button', { name: 'Iniciar sesión en LectoApp' }));
    await waitFor(() => {
      expect(getByText('Ingresa tu correo y tu contraseña para continuar.')).toBeTruthy();
    });
  });

  it('llama a login con el correo y la contrasena del formulario', async () => {
    mockLogin.mockResolvedValue(undefined);
    const { getByRole, getByLabelText } = render(<LoginScreen navigation={navigation} route={route} />);

    fireEvent.changeText(getByLabelText('Correo escolar o de estudiante'), 'test@gt.gt');
    fireEvent.changeText(getByLabelText('Contraseña'), 'Secreto1234!');
    fireEvent.press(getByRole('button', { name: 'Iniciar sesión en LectoApp' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@gt.gt', 'Secreto1234!');
    });
  });

  it('muestra mensaje amigable si login lanza error 401', async () => {
    mockLogin.mockRejectedValue(new ApiError('unauthorized', 'expirado', 401));
    const { getByRole, getByLabelText, getByText } = render(
      <LoginScreen navigation={navigation} route={route} />,
    );

    fireEvent.changeText(getByLabelText('Correo escolar o de estudiante'), 'malo@gt.gt');
    fireEvent.changeText(getByLabelText('Contraseña'), 'Contrasena1');
    fireEvent.press(getByRole('button', { name: 'Iniciar sesión en LectoApp' }));

    await waitFor(() => {
      expect(
        getByText('El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.'),
      ).toBeTruthy();
    });
  });

  it('navega a Register al pulsar el enlace de creacion de cuenta', () => {
    const { getByRole } = render(<LoginScreen navigation={navigation} route={route} />);
    fireEvent.press(getByRole('link', { name: 'Crear una cuenta nueva' }));
    expect(mockNavigate).toHaveBeenCalledWith('Register');
  });
});
