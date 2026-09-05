import { apiClient } from '../client';
import { ApiError } from '../errors';
import { httpSession } from '../http';

/**
 * Tests del apiClient — cubre register() y los métodos de progreso
 * que complementan los tests de la capa HTTP.
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

describe('apiClient.register', () => {
  it('llama a POST /auth/register y devuelve la sesion', async () => {
    const responseData = {
      user: { id: 'u1', name: 'Ana', email: 'ana@gt.gt', role: 'STUDENT', currentLevel: 'BEGINNER', totalPoints: 0, streak: 0 },
      accessToken: 'tok-access',
      refreshToken: 'tok-refresh',
    };
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: responseData, error: null }));

    const result = await apiClient.register('Ana González', 'ana@gt.gt', 'Segura123!', 'Básicos (1ro–3ro)');

    expect(result.user.name).toBe('Ana');
    expect(result.accessToken).toBe('tok-access');
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/register');
    expect(init.method).toBe('POST');
    // El registro NO debe enviar Authorization header
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('propaga ApiError si el correo ya esta registrado (409)', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: false, data: null, error: 'Email ya registrado' }, 409),
    );
    const error = await apiClient.register('Alguien', 'ya@existe.gt', 'Pass1234').catch((e) => e);
    // 409 cae en el bucket generico (no 401/403/404/5xx)
    expect(error).toBeInstanceOf(ApiError);
  });

  it('incluye gradeLevel en el body solo si se proporciona', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ success: true, data: { user: {}, accessToken: '', refreshToken: '' }, error: null }),
    );

    // Con gradeLevel
    await apiClient.register('Test', 't@t.gt', 'Pass12345', 'Primaria').catch(() => {});
    let body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.gradeLevel).toBe('Primaria');

    mockFetch.mockReset();
    mockFetch.mockResolvedValue(
      jsonResponse({ success: true, data: { user: {}, accessToken: '', refreshToken: '' }, error: null }),
    );

    // Sin gradeLevel
    await apiClient.register('Test', 't@t.gt', 'Pass12345').catch(() => {});
    body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.gradeLevel).toBeUndefined();
  });
});

describe('apiClient.submitQuiz', () => {
  it('convierte el mapa de respuestas al formato que espera el backend', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: {
          attempt: { id: 'a1', score: 2, totalQuestions: 2, percentage: 100, passed: true, timeSpentSec: 30, results: [] },
          progress: { bestScore: 100, attempts: 1, completed: true, isNewCompletion: true },
          rewards: { pointsEarned: 50, totalPoints: 400, levelUp: false, newLevel: null },
        },
        error: null,
      }),
    );
    httpSession.set({ accessToken: 'abc', refreshToken: 'def' });

    const result = await apiClient.submitQuiz('r1', { 'q1': 'opt1', 'q2': 'opt2' }, 30);

    expect(result.attempt.passed).toBe(true);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.readingId).toBe('r1');
    expect(body.answers).toEqual([
      { questionId: 'q1', selectedAnswer: 'opt1' },
      { questionId: 'q2', selectedAnswer: 'opt2' },
    ]);
    expect(body.timeSpentSec).toBe(30);
  });
});
