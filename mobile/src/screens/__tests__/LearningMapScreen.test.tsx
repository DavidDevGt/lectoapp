import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { buildReadingListItem } from '../../test/fixtures';

// Mocks de dependencias
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Carlos', totalPoints: 100, streak: 2 },
    isBootstrapping: false,
    isLoggingIn: false,
    isRegistering: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    applyServerTotals: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockGetReadings = jest.fn();
jest.mock('../../api/client', () => ({
  apiClient: { getReadings: (...args: unknown[]) => mockGetReadings(...args) },
}));

const mockNavigate = jest.fn();
const navigation = { navigate: mockNavigate } as never;
const route = { key: 'Ruta', name: 'Ruta' } as never;

// eslint-disable-next-line import/first
import { LearningMapScreen } from '../LearningMapScreen';

const makePaginated = (items = [buildReadingListItem()]) => ({
  items,
  meta: { page: 1, limit: 20, total: items.length, totalPages: 1 },
});

describe('LearningMapScreen', () => {
  beforeEach(() => {
    mockGetReadings.mockReset();
    mockNavigate.mockReset();
  });

  it('muestra el estado de carga y luego la tarjeta de lectura', async () => {
    mockGetReadings.mockResolvedValue(makePaginated());
    const { getByText, getByLabelText } = render(
      <LearningMapScreen navigation={navigation} route={route} />,
    );

    // El titulo del banner siempre está visible
    expect(getByText('Tu Ruta de Lectura')).toBeTruthy();

    // Esperar a que aparezca la tarjeta de lectura del fixture
    await waitFor(() => {
      expect(getByLabelText(/El quetzal y la montaña/)).toBeTruthy();
    });
  });

  it('muestra estado vacio cuando no hay lecturas', async () => {
    mockGetReadings.mockResolvedValue(makePaginated([]));
    const { findByText } = render(
      <LearningMapScreen navigation={navigation} route={route} />,
    );
    await findByText('Todavía no hay lecturas publicadas');
  });

  it('muestra ErrorState cuando la API falla', async () => {
    mockGetReadings.mockRejectedValue(new Error('Sin conexion'));
    const { findByText } = render(
      <LearningMapScreen navigation={navigation} route={route} />,
    );
    // ErrorState siempre tiene un botón de reintentar
    await findByText('Reintentar');
  });

  it('navega a Reader al pulsar una lectura', async () => {
    mockGetReadings.mockResolvedValue(makePaginated());
    const { getByLabelText } = render(
      <LearningMapScreen navigation={navigation} route={route} />,
    );
    await waitFor(() => getByLabelText(/El quetzal y la montaña/));
    fireEvent.press(getByLabelText(/El quetzal y la montaña/));
    expect(mockNavigate).toHaveBeenCalledWith('Reader', { readingId: 'reading-1' });
  });
});
