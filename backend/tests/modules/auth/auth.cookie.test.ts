import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Request, Response } from 'express';

/**
 * Atributos de la cookie de refresh.
 *
 * `Secure` depende de COOKIE_SECURE, que sigue a NODE_ENV. Los tests de ruta
 * corren en 'test', donde es false, así que el caso de producción —el único que
 * importa de verdad— solo se puede comprobar aquí, sustituyendo el módulo de
 * configuración.
 */

const captured: { name?: string; value?: string; options?: Record<string, unknown> } = {};

function fakeResponse(): Response {
  return {
    cookie: (name: string, value: string, options: Record<string, unknown>) => {
      captured.name = name;
      captured.value = value;
      captured.options = options;
    },
    clearCookie: (name: string, options: Record<string, unknown>) => {
      captured.name = name;
      captured.options = options;
    },
  } as unknown as Response;
}

function fakeRequest(headers: Record<string, string>, cookies?: Record<string, string>): Request {
  return { headers, cookies } as unknown as Request;
}

async function loadCookieModule(cookieSecure: boolean) {
  vi.resetModules();
  vi.doMock('../../../src/config/env', () => ({
    env: { COOKIE_SECURE: cookieSecure },
  }));
  return import('../../../src/modules/auth/auth.cookie');
}

afterEach(() => {
  vi.doUnmock('../../../src/config/env');
  vi.resetModules();
});

describe('cookie de refresh', () => {
  it('marca Secure cuando COOKIE_SECURE está activo (producción)', async () => {
    const { setRefreshCookie } = await loadCookieModule(true);

    setRefreshCookie(fakeResponse(), 'un-token');

    expect(captured.options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/api/auth',
    });
  });

  it('permite HTTP en desarrollo pero mantiene HttpOnly y SameSite', async () => {
    const { setRefreshCookie } = await loadCookieModule(false);

    setRefreshCookie(fakeResponse(), 'un-token');

    expect(captured.options).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
    });
  });

  it('caduca a los 7 días, igual que el refresh token', async () => {
    const { setRefreshCookie } = await loadCookieModule(true);

    setRefreshCookie(fakeResponse(), 'un-token');

    expect(captured.options?.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('borra la cookie con los mismos atributos y sin maxAge', async () => {
    const { clearRefreshCookie } = await loadCookieModule(true);

    clearRefreshCookie(fakeResponse());

    // Si path o sameSite no coinciden con los del Set-Cookie original, el
    // navegador conserva la cookie vieja y el borrado no surte efecto.
    expect(captured.options).toMatchObject({ path: '/api/auth', sameSite: 'strict', httpOnly: true });
    expect(captured.options).not.toHaveProperty('maxAge');
  });
});

describe('resolución del transporte', () => {
  it('detecta el modo cookie por la cabecera X-Auth-Transport', async () => {
    const { usesCookieTransport } = await loadCookieModule(true);

    expect(usesCookieTransport(fakeRequest({ 'x-auth-transport': 'cookie' }))).toBe(true);
    expect(usesCookieTransport(fakeRequest({}))).toBe(false);
    expect(usesCookieTransport(fakeRequest({ 'x-auth-transport': 'body' }))).toBe(false);
  });

  it('en modo cookie lee la cookie e ignora el cuerpo', async () => {
    const { readRefreshToken } = await loadCookieModule(true);

    const req = fakeRequest({ 'x-auth-transport': 'cookie' }, { lectoapp_rt: 'de-la-cookie' });

    expect(readRefreshToken(req, 'del-cuerpo')).toBe('de-la-cookie');
  });

  it('en modo cookie devuelve undefined si no hay cookie, aunque venga en el cuerpo', async () => {
    const { readRefreshToken } = await loadCookieModule(true);

    const req = fakeRequest({ 'x-auth-transport': 'cookie' }, {});

    expect(readRefreshToken(req, 'del-cuerpo')).toBeUndefined();
  });

  it('sin la cabecera lee el cuerpo — es el camino de la app móvil', async () => {
    const { readRefreshToken } = await loadCookieModule(true);

    const req = fakeRequest({}, { lectoapp_rt: 'de-la-cookie' });

    expect(readRefreshToken(req, 'del-cuerpo')).toBe('del-cuerpo');
  });
});
