import { ApiMeta, ApiResponse } from '../types/api';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL;

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
    headers: {
      'Content-Type': 'application/json',
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

async function tryRefreshAccessToken(): Promise<boolean> {
  const { refreshToken, setAccessToken, clearSession } = useAuthStore.getState();
  if (!refreshToken) return false;

  const { res, body } = await rawRequest<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });

  if (!res.ok || !body.data) {
    clearSession();
    return false;
  }

  setAccessToken(body.data.accessToken);
  return true;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let { res, body } = await rawRequest<T>(path, options);

  if (res.status === 401 && path !== '/auth/refresh' && path !== '/auth/login') {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      ({ res, body } = await rawRequest<T>(path, options));
    }
  }

  if (!res.ok || !body.success) {
    throw new ApiError(body.error ?? 'Error inesperado', res.status, (body as { details?: { field: string; message: string }[] }).details);
  }

  return body.data as T;
}

export async function apiRequestPaginated<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ items: T[]; meta: ApiMeta }> {
  let { res, body } = await rawRequest<T[]>(path, options);

  if (res.status === 401 && path !== '/auth/refresh' && path !== '/auth/login') {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      ({ res, body } = await rawRequest<T[]>(path, options));
    }
  }

  if (!res.ok || !body.success) {
    throw new ApiError(body.error ?? 'Error inesperado', res.status, (body as { details?: { field: string; message: string }[] }).details);
  }

  return { items: body.data ?? [], meta: body.meta as ApiMeta };
}
