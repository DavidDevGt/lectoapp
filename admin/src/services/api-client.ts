import { ApiMeta, ApiResponse } from '../types/api';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Declara que este cliente usa cookie HttpOnly para el refresh token. El
 * backend lo lee para decidir si devuelve el token en el cuerpo (app móvil) o
 * lo pone en una cookie que este código no puede leer (aquí). Ver
 * backend/src/modules/auth/auth.cookie.ts.
 */
const AUTH_TRANSPORT_HEADER = { 'X-Auth-Transport': 'cookie' } as const;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  // API_URL can be absolute ('http://localhost:3000/api') or relative ('/api').
  // URL constructor requires an absolute base, so we use window.location.origin as fallback.
  const base = API_URL?.startsWith('http') ? API_URL : `${window.location.origin}${API_URL ?? '/api'}`;
  const url = new URL(`${base}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function rawRequest<T>(path: string, options: RequestOptions): Promise<{ res: Response; body: ApiResponse<T> }> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    // Sin esto el navegador no adjunta la cookie de refresh y /auth/refresh
    // responde 401 siempre.
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...AUTH_TRANSPORT_HEADER,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 204) {
    return { res, body: { success: true, data: null, error: null } };
  }

  const body = (await res.json()) as ApiResponse<T>;
  return { res, body };
}

/**
 * Deduplica refrescos concurrentes.
 *
 * El dashboard lanza varias consultas a la vez. Si el access token acaba de
 * caducar, todas responden 401 a la vez y cada una intentaría rotar por su
 * cuenta. Como el backend revoca el token anterior en cada rotación, el segundo
 * refresh presentaría uno ya revocado — y el servidor lo interpretaría,
 * correctamente, como un robo: revocaría la familia entera y cerraría la
 * sesión. Con un único refresh en vuelo compartido, eso no puede ocurrir.
 */
let inFlightRefresh: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  const { setAccessToken, clearSession } = useAuthStore.getState();

  // Sin cuerpo: el refresh token va en la cookie HttpOnly. El servidor
  // sobrescribe esa cookie con el token rotado, así que el cliente no puede
  // quedarse con el viejo ni aunque quiera.
  const { res, body } = await rawRequest<{ accessToken: string }>('/auth/refresh', {
    method: 'POST',
  });

  if (!res.ok || !body.data) {
    clearSession();
    return false;
  }

  setAccessToken(body.data.accessToken);
  return true;
}

export async function refreshAccessToken(): Promise<boolean> {
  inFlightRefresh ??= performRefresh().finally(() => {
    inFlightRefresh = null;
  });
  return inFlightRefresh;
}

function shouldTryRefresh(status: number, path: string): boolean {
  return status === 401 && path !== '/auth/refresh' && path !== '/auth/login';
}

function unwrap<T>(res: Response, body: ApiResponse<T>): void {
  if (!res.ok || !body.success) {
    throw new ApiError(
      body.error ?? 'Error inesperado',
      res.status,
      (body as { details?: { field: string; message: string }[] }).details,
    );
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let { res, body } = await rawRequest<T>(path, options);

  if (shouldTryRefresh(res.status, path)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      ({ res, body } = await rawRequest<T>(path, options));
    }
  }

  unwrap(res, body);
  return body.data as T;
}

export async function apiRequestPaginated<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ items: T[]; meta: ApiMeta }> {
  let { res, body } = await rawRequest<T[]>(path, options);

  if (shouldTryRefresh(res.status, path)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      ({ res, body } = await rawRequest<T[]>(path, options));
    }
  }

  unwrap(res, body);
  return { items: body.data ?? [], meta: body.meta as ApiMeta };
}
