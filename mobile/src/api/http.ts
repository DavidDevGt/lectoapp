import { getApiBaseUrl, REQUEST_TIMEOUT_MS } from '../config/env';
import { AbortedError, ApiError } from './errors';
import { StoredSession } from './tokenStore';

/**
 * Capa HTTP: timeout por petición, rotación de refresh token y errores tipados.
 *
 * Ningún fallo se traga: todo camino de error termina lanzando ApiError o AbortedError.
 */

interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Señal externa para cancelar (cambio de filtro, desmontaje de pantalla). */
  signal?: AbortSignal;
  /** Las rutas públicas (login, refresh) no adjuntan Authorization ni reintentan con refresh. */
  auth?: boolean;
}

let session: StoredSession | null = null;
let onSessionExpired: (() => void) | null = null;
/** Deduplica refrescos concurrentes: varias peticiones en 401 comparten un solo refresh. */
let inFlightRefresh: Promise<StoredSession | null> | null = null;

export const httpSession = {
  set(next: StoredSession | null): void {
    session = next;
  },
  get(): StoredSession | null {
    return session;
  },
  /** AuthContext registra aquí su logout para reaccionar a un refresh token muerto. */
  onExpired(handler: (() => void) | null): void {
    onSessionExpired = handler;
  },
};

/** Une la señal externa con un timeout propio en un solo AbortController. */
function withTimeout(external?: AbortSignal): {
  signal: AbortSignal;
  cleanup: () => void;
  timedOut: () => boolean;
} {
  const controller = new AbortController();
  let didTimeout = false;

  const timer = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  const forwardAbort = () => controller.abort();
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener('abort', forwardAbort);
  }

  return {
    signal: controller.signal,
    timedOut: () => didTimeout,
    cleanup: () => {
      clearTimeout(timer);
      external?.removeEventListener('abort', forwardAbort);
    },
  };
}

function errorFromStatus(status: number, message: string | null): ApiError {
  if (status === 401 || status === 403) {
    return new ApiError('unauthorized', message ?? 'Sesión inválida', status);
  }
  if (status === 404) {
    return new ApiError('notFound', message ?? 'Recurso no encontrado', status);
  }
  if (status >= 500) {
    return new ApiError('server', message ?? 'Error del servidor', status);
  }
  return new ApiError('validation', message ?? 'La solicitud no es válida', status);
}

async function rawRequest<T>(path: string, options: RequestOptions): Promise<ApiEnvelope<T>> {
  const { method = 'GET', body, signal, auth = true } = options;
  let baseUrl: string;
  try {
    baseUrl = getApiBaseUrl();
  } catch (configError) {
    throw new ApiError(
      'unknown',
      configError instanceof Error ? configError.message : 'Configuración de API inválida',
    );
  }

  const { signal: timedSignal, cleanup, timedOut } = withTimeout(signal);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      signal: timedSignal,
      headers: {
        'Content-Type': 'application/json',
        ...(auth && session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    // fetch solo rechaza por abort o por fallo de transporte.
    if (timedOut()) throw new ApiError('timeout', 'La petición excedió el tiempo de espera');
    if (signal?.aborted) throw new AbortedError();
    throw new ApiError('offline', 'No se pudo contactar al servidor');
  } finally {
    cleanup();
  }

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    envelope = null;
  }

  if (!response.ok) {
    throw errorFromStatus(response.status, envelope?.error ?? null);
  }
  if (!envelope || envelope.data === null) {
    throw new ApiError('unknown', 'El servidor devolvió una respuesta vacía', response.status);
  }
  return envelope;
}

/** Rota el par de tokens. Devuelve null si el refresh token ya no sirve. */
async function refreshSession(): Promise<StoredSession | null> {
  const current = session;
  if (!current) return null;

  try {
    const envelope = await rawRequest<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      { method: 'POST', body: { refreshToken: current.refreshToken }, auth: false },
    );
    const next: StoredSession = {
      accessToken: envelope.data!.accessToken,
      refreshToken: envelope.data!.refreshToken,
    };
    session = next;
    return next;
  } catch {
    return null;
  }
}

async function ensureRefreshed(): Promise<StoredSession | null> {
  inFlightRefresh ??= refreshSession().finally(() => {
    inFlightRefresh = null;
  });
  return inFlightRefresh;
}

/**
 * Petición con reintento único tras rotar el token.
 * Devuelve el sobre completo para que quien llame pueda leer `meta` de paginación.
 */
export async function requestEnvelope<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  try {
    return await rawRequest<T>(path, options);
  } catch (error) {
    const canRetry =
      error instanceof ApiError &&
      error.kind === 'unauthorized' &&
      options.auth !== false &&
      session !== null;

    if (!canRetry) throw error;

    const refreshed = await ensureRefreshed();
    if (!refreshed) {
      session = null;
      onSessionExpired?.();
      throw error;
    }
    return rawRequest<T>(path, options);
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const envelope = await requestEnvelope<T>(path, options);
  return envelope.data as T;
}
