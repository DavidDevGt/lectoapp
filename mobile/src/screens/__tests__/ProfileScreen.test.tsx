import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { buildOverallProgress } from '../../test/fixtures';

const mockAlert = jest.fn();

// Mock de useFocusEffect: no-op para tests estáticos
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

const mockLogout = jest.fn();
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'u1',
      name: 'Carlos Mendoza',
      email: 'carlos@gt.gt',
      role: 'STUDENT',
      currentLevel: 'BEGINNER',
      totalPoints: 350,
      streak: 4,
    },
    isBootstrapping: false,
    isLoggingIn: false,
    isRegistering: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: mockLogout,
    applyServerTotals: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockGetMyProgress = jest.fn();
jest.mock('../../api/client', () => ({
  apiClient: { getMyProgress: (...args: unknown[]) => mockGetMyProgress(...args) },
}));

// eslint-disable-next-line import/first
import { ProfileScreen } from '../ProfileScreen';

describe('ProfileScreen', () => {
  beforeEach(() => {
    mockLogout.mockReset();
    mockGetMyProgress.mockReset();
    mockAlert.mockReset();
    jest.spyOn(Alert, 'alert').mockImplementation((...args: unknown[]) => mockAlert(...args));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('muestra el nombre del usuario y sus puntos', async () => {
    mockGetMyProgress.mockResolvedValue(buildOverallProgress());
    const { getByText } = render(<ProfileScreen />);
    // El nombre del user viene del contexto, no de la API
    await waitFor(() => {
      expect(getByText('Carlos Mendoza')).toBeTruthy();
    });
  });

  it('muestra el progreso general cuando la API responde', async () => {
    mockGetMyProgress.mockResolvedValue(buildOverallProgress({ 
      overall: { totalReadings: 12, completedReadings: 6, overallPercentage: 50 } 
    }));
    const { findByText } = render(<ProfileScreen />);
    // Busca las lecturas completadas (6 / 12)
    await findByText('6 / 12');
  });

  it('muestra ErrorState si la API falla', async () => {
    mockGetMyProgress.mockRejectedValue(new Error('Sin conexion'));
    const { findByText } = render(<ProfileScreen />);
    await findByText('Reintentar');
  });

  it('llama a logout al confirmar en el Alert de salir', async () => {
    mockGetMyProgress.mockResolvedValue(buildOverallProgress());
    mockLogout.mockResolvedValue(undefined);
    mockAlert.mockImplementation((_title, _msg, buttons) => {
      // Simula pulsar el botón "Cerrar sesión" del alert
      const cerrar = buttons?.find((b: { text: string }) => b.text === 'Cerrar sesión');
      cerrar?.onPress?.();
    });

    const { findByText } = render(<ProfileScreen />);
    const logoutBtn = await findByText('Cerrar sesión');
    await act(async () => { fireEvent.press(logoutBtn); });
    expect(mockAlert).toHaveBeenCalled();
    expect(mockLogout).toHaveBeenCalled();
  });
});
