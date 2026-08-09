import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from '../stores/authStore';

// Variables para controlar las respuestas del fetch mock
let fetchResponses: { status: number; body: unknown }[] = [];
let fetchCallCount = 0;

// Mock global de fetch
const fetchMock = vi.fn().mockImplementation(async () => {
  const response = fetchResponses[fetchCallCount] ?? fetchResponses[0];
  fetchCallCount++;
  return {
    ok: response ? response.status >= 200 && response.status < 300 : false,
    status: response?.status ?? 500,
    json: async () => response?.body ?? {},
  };
});

// Necesitamos mockear antes de importar el módulo bajo test
vi.stubGlobal('fetch', fetchMock);

// Importamos después de configurar los mocks globales
const { apiRequest, apiRequestPaginated, ApiError } = await import('./api-client');

describe('api-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCallCount = 0;
    fetchResponses = [];
    useAuthStore.setState({
      user: null,
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    });
  });

  afterEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
    });
  });

  describe('apiRequest', () => {
    it('debería retornar data cuando la respuesta es exitosa', async () => {
      fetchResponses = [{
        status: 200,
        body: { success: true, data: { id: '1', name: 'Test' }, error: null },
      }];

      const result = await apiRequest<{ id: string; name: string }>('/test');

      expect(result).toEqual({ id: '1', name: 'Test' });
    });

    it('debería lanzar ApiError cuando la respuesta no es exitosa', async () => {
      fetchResponses = [{
        status: 400,
        body: { success: false, data: null, error: 'Datos inválidos' },
      }];

      await expect(apiRequest('/test')).rejects.toThrow(ApiError);
      await expect(apiRequest('/test', {})).rejects.toThrow('Datos inválidos');
    });

    it('debería enviar el Authorization header con el token', async () => {
      fetchResponses = [{
        status: 200,
        body: { success: true, data: null, error: null },
      }];

      await apiRequest('/test');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
          }),
        }),
      );
    });

    it('debería usar el método GET por defecto', async () => {
      fetchResponses = [{
        status: 200,
        body: { success: true, data: null, error: null },
      }];

      await apiRequest('/test');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('debería serializar el body como JSON para POST', async () => {
      fetchResponses = [{
        status: 201,
        body: { success: true, data: { id: '1' }, error: null },
      }];

      await apiRequest('/test', {
        method: 'POST',
        body: { name: 'Test' },
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test' }),
        }),
      );
    });
  });

  describe('apiRequestPaginated', () => {
    it('debería retornar items y meta', async () => {
      fetchResponses = [{
        status: 200,
        body: {
          success: true,
          data: [{ id: '1' }, { id: '2' }],
          error: null,
          meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
        },
      }];

      const result = await apiRequestPaginated<{ id: string }>('/test');

      expect(result.items).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('debería retornar array vacío cuando data es null', async () => {
      fetchResponses = [{
        status: 200,
        body: {
          success: true,
          data: null,
          error: null,
          meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
        },
      }];

      const result = await apiRequestPaginated<{ id: string }>('/test');

      expect(result.items).toEqual([]);
    });
  });

  describe('refresh automático de token', () => {
    it('debería reintentar la request después de un refresh exitoso al recibir 401', async () => {
      fetchResponses = [
        // Primera llamada: 401
        { status: 401, body: { success: false, data: null, error: 'Token expirado' } },
        // Refresh exitoso
        {
          status: 200,
          body: {
            success: true,
            data: { accessToken: 'new-access', refreshToken: 'new-refresh' },
            error: null,
          },
        },
        // Retry exitoso con nuevo token
        {
          status: 200,
          body: { success: true, data: { id: '1' }, error: null },
        },
      ];

      const result = await apiRequest<{ id: string }>('/readings');

      expect(result).toEqual({ id: '1' });
      // fetch fue llamado 3 veces: original, refresh, retry
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('no debería intentar refresh para la ruta /auth/login', async () => {
      fetchResponses = [
        { status: 401, body: { success: false, data: null, error: 'Credenciales inválidas' } },
      ];

      await expect(apiRequest('/auth/login', { method: 'POST', body: {} }))
        .rejects.toThrow(ApiError);

      // Solo una llamada — no intentó refresh
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
