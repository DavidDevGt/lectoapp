import type { CookieOptions, Request, Response } from 'express';
import { env } from '../../config/env';

/**
 * Transporte del refresh token.
 *
 * El backend sirve dos clientes con modelos de sesión distintos y ninguno de los
 * dos puede imponerle el suyo al otro:
 *
 *  - El panel admin corre en un navegador, donde cualquier token accesible desde
 *    JavaScript se pierde con un solo XSS. Ahí el refresh token viaja en una
 *    cookie HttpOnly que el código de la SPA no puede leer.
 *
 *  - La app móvil es React Native: no hay `document.cookie` ni política de
 *    origen, y ya guarda la sesión en el Keychain/Keystore vía expo-secure-store,
 *    que es el equivalente correcto en esa plataforma. Ahí el token sigue
 *    viajando en el cuerpo de la petición.
 *
 * El cliente declara qué transporte usa con la cabecera `X-Auth-Transport`. Es
 * explícito a propósito: deducirlo del `Origin` o del `User-Agent` sería
 * adivinar, y equivocarse significa devolverle a un navegador un refresh token
 * en el cuerpo — justo lo que este cambio elimina.
 */
export const AUTH_TRANSPORT_HEADER = 'x-auth-transport';
export const REFRESH_COOKIE_NAME = 'lectoapp_rt';

const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * `path` limita la cookie a las rutas de autenticación: el navegador no la
 * adjunta a `/api/readings` ni a ninguna otra llamada, así que el token queda
 * fuera del alcance de la inmensa mayoría de las peticiones. Solo /refresh y
 * /logout la necesitan.
 */
const REFRESH_COOKIE_PATH = '/api/auth';

function refreshCookieOptions(): CookieOptions {
  return {
    // Inaccesible desde JavaScript: es lo que impide que un XSS se lleve la
    // sesión de siete días.
    httpOnly: true,
    // Solo por HTTPS. En producción env.ts se niega a arrancar si esto es false.
    secure: env.COOKIE_SECURE,
    // El navegador no envía la cookie en peticiones iniciadas desde otro sitio,
    // que es la defensa principal contra CSRF sobre /refresh y /logout.
    sameSite: 'strict',
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  };
}

/** ¿Este cliente usa cookie para el refresh token? Lo declara el propio cliente. */
export function usesCookieTransport(req: Request): boolean {
  return req.headers[AUTH_TRANSPORT_HEADER] === 'cookie';
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions());
}

export function clearRefreshCookie(res: Response): void {
  // `clearCookie` solo funciona si path y demás atributos coinciden con los del
  // `Set-Cookie` original; si no, el navegador se queda con la cookie vieja.
  const { maxAge: _maxAge, ...options } = refreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE_NAME, options);
}

/**
 * Resuelve el refresh token de la petición.
 *
 * La cookie manda sobre el cuerpo: un cliente en modo cookie que además mande un
 * token en el body estaría intentando eludir el transporte seguro.
 */
export function readRefreshToken(req: Request, bodyToken?: string): string | undefined {
  if (usesCookieTransport(req)) {
    return (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE_NAME];
  }
  return bodyToken;
}
