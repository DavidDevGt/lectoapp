import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from '../stores/authStore';

// Variables para controlar las respuestas del fetch mock
let fetchResponses: { status: number; body: unknown }[] = [];
let fetchCallCount = 0;

// Implementación por defecto: va devolviendo `fetchResponses` en orden.
// Se reinstala en cada beforeEach porque algún test la sustituye por una propia
// y `vi.clearAllMocks()` limpia las llamadas, no la implementación.
async function defaultFetchImpl() {
  const response = fetchResponses[fetchCallCount] ?? fetchResponses[0];
  fetchCallCount++;
  return {
    ok: response ? response.status >= 200 && response.status < 300 : false,
    status: response?.status ?? 500,
    json: async () => response?.body ?? {},
  };
}

// Mock global de fetch
const fetchMock = vi.fn().mockImplementation(defaultFetchImpl);

// Necesitamos mockear antes de importar el módulo bajo test
vi.stubGlobal('fetch', fetchMock);

// Importamos después de configurar los mocks globales
const { apiRequest, apiRequestPaginated, ApiError } = await import('./api-client');

describe('api-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockImplementation(defaultFetchImpl);
    fetchCallCount = 0;
    fetchResponses = [];
    useAuthStore.setState({
      user: null,
      accessToken: 'test-access-token',
      status: 'authenticated',
    });
  });

  afterEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, status: 'anonymous' });
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

    it('debería enviar las credenciales y declarar el transporte cookie', async () => {
      fetchResponses = [{ status: 200, body: { success: true, data: null, error: null } }];

      await apiRequest('/test');

      // Sin `credentials: 'include'` el navegador no adjunta la cookie de
      // refresh y /auth/refresh respondería 401 siempre.
      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({ 'X-Auth-Transport': 'cookie' }),
        }),
      );
    });

    it('debería enviar POST con body serializado', async () => {
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
        // Refresh exitoso — solo accessToken: el refresh token va en la cookie
        {
          status: 200,
          body: { success: true, data: { accessToken: 'new-access' }, error: null },
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
      expect(useAuthStore.getState().accessToken).toBe('new-access');
    });

    it('no debería enviar el refresh token en el cuerpo al refrescar', async () => {
      fetchResponses = [
        { status: 401, body: { success: false, data: null, error: 'Token expirado' } },
        { status: 200, body: { success: true, data: { accessToken: 'new-access' }, error: null } },
        { status: 200, body: { success: true, data: { id: '1' }, error: null } },
      ];

      await apiRequest('/readings');

      const refreshCall = fetchMock.mock.calls.find(([url]) =>
        String(url).includes('/auth/refresh'),
      );

      expect(refreshCall).toBeDefined();
      // El token viaja en la cookie HttpOnly: si apareciera aquí, sería legible
      // desde JavaScript y la cookie no serviría de nada.
      expect(refreshCall?.[1]?.body).toBeUndefined();
    });

    it('debería limpiar la sesión cuando el refresh falla', async () => {
      fetchResponses = [
        { status: 401, body: { success: false, data: null, error: 'Token expirado' } },
        { status: 401, body: { success: false, data: null, error: 'Refresh token inválido' } },
      ];

      await expect(apiRequest('/readings')).rejects.toThrow(ApiError);

      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().status).toBe('anonymous');
    });

    /**
     * El dashboard lanza varias consultas a la vez. Si cada 401 disparase su
     * propio refresh, el segundo presentaría un token ya rotado y el backend lo
     * leería como reutilización: revocaría la familia entera y cerraría la
     * sesión. Debe haber un solo refresh en vuelo.
     */
    it('debería deduplicar refrescos concurrentes en una sola llamada', async () => {
      let call = 0;
      fetchMock.mockImplementation(async (url: string) => {
        call++;
        if (String(url).includes('/auth/refresh')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: { accessToken: 'rotado' }, error: null }),
          };
        }
        // Las dos primeras peticiones de recurso caducan; las siguientes pasan.
        if (call <= 2) {
          return {
            ok: false,
            status: 401,
            json: async () => ({ success: false, data: null, error: 'Token expirado' }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { id: 'ok' }, error: null }),
        };
      });

      await Promise.all([apiRequest('/readings'), apiRequest('/users')]);

      const refreshCalls = fetchMock.mock.calls.filter(([url]) =>
        String(url).includes('/auth/refresh'),
      );

      expect(refreshCalls).toHaveLength(1);
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
