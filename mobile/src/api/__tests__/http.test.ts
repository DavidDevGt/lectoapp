import { apiClient } from '../client';
import { ApiError } from '../errors';
import { httpSession } from '../http';

/**
 * Estos tests blindan la regla central de la app: ante un fallo de red NUNCA se
 * devuelven datos inventados; se propaga un ApiError para que la UI lo muestre.
 */

const mockFetch = jest.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
  httpSession.set(null);
  httpSession.onExpired(null);
});

describe('capa HTTP', () => {
  it('devuelve los datos del sobre cuando la respuesta es correcta', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: [{ id: 'r1' }], error: null, meta: null }),
    );

    const result = await apiClient.getReadings();
    expect(result.items).toEqual([{ id: 'r1' }]);
  });

  it('convierte un fallo de transporte en ApiError "offline" en vez de datos falsos', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(apiClient.getReadings()).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'offline',
    });
  });

  it('propaga 404 como ApiError "notFound" sin sustituir la lectura por otra', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: false, data: null, error: 'No encontrada' }, 404),
    );

    const error = await apiClient.getReadingById('inexistente').catch((caught) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).kind).toBe('notFound');
  });

  it('no califica cuestionarios localmente: un fallo al enviar se propaga', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(apiClient.submitQuiz('r1', { q1: 'opt1' })).rejects.toBeInstanceOf(ApiError);
  });

  it('rota el token ante un 401 y reintenta la petición original', async () => {
    httpSession.set({ accessToken: 'viejo', refreshToken: 'refresh-1' });

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ success: false, data: null, error: 'expirado' }, 401))
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: { accessToken: 'nuevo', refreshToken: 'refresh-2' },
          error: null,
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ success: true, data: { totalPoints: 10 }, error: null }),
      );

    const progress = await apiClient.getMyProgress();

    expect(progress).toEqual({ totalPoints: 10 });
    expect(httpSession.get()).toEqual({ accessToken: 'nuevo', refreshToken: 'refresh-2' });

    const retryHeaders = mockFetch.mock.calls[2][1].headers;
    expect(retryHeaders.Authorization).toBe('Bearer nuevo');
  });

  it('avisa que la sesión expiró cuando el refresh token ya no sirve', async () => {
    httpSession.set({ accessToken: 'viejo', refreshToken: 'muerto' });
    const onExpired = jest.fn();
    httpSession.onExpired(onExpired);

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ success: false, data: null, error: 'expirado' }, 401))
      .mockResolvedValueOnce(jsonResponse({ success: false, data: null, error: 'inválido' }, 401));

    await expect(apiClient.getMyProgress()).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(httpSession.get()).toBeNull();
  });

  it('adjunta el token a las peticiones autenticadas y lo omite en el login', async () => {
    httpSession.set({ accessToken: 'abc', refreshToken: 'def' });
    mockFetch.mockResolvedValue(jsonResponse({ success: true, data: {}, error: null }));

    await apiClient.getMyProgress();
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer abc');

    await apiClient.login('a@b.gt', 'secreto');
    expect(mockFetch.mock.calls[1][1].headers.Authorization).toBeUndefined();
  });
});
