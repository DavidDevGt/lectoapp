/**
 * Errores tipados de la capa de red.
 *
 * Regla del proyecto: la app NUNCA inventa datos cuando la red falla. Todo fallo
 * se convierte en un ApiError que la UI debe mostrar con una vía de recuperación.
 */

export type ApiErrorKind =
  | 'offline' // No hay conexión / el host no respondió
  | 'timeout' // La petición excedió el tiempo máximo
  | 'unauthorized' // 401/403 — sesión inválida o expirada
  | 'notFound' // 404
  | 'validation' // 4xx con mensaje del backend
  | 'server' // 5xx
  | 'unknown';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;

  constructor(kind: ApiErrorKind, message: string, status: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }

  /** Si el usuario puede resolverlo reintentando (vs. tener que iniciar sesión otra vez). */
  get isRetryable(): boolean {
    return this.kind === 'offline' || this.kind === 'timeout' || this.kind === 'server';
  }
}

/** Petición abortada a propósito (cambio de filtro, desmontaje). No es un error para el usuario. */
export class AbortedError extends Error {
  constructor() {
    super('Petición cancelada');
    this.name = 'AbortedError';
  }
}

export function isAborted(error: unknown): boolean {
  return error instanceof AbortedError;
}

/** Mensaje corto y accionable en español para mostrar en pantalla. */
export function toUserMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.kind) {
      case 'offline':
        return 'No hay conexión a internet. Revisa tu red e inténtalo de nuevo.';
      case 'timeout':
        return 'El servidor está tardando demasiado en responder.';
      case 'unauthorized':
        return 'Tu sesión expiró. Vuelve a iniciar sesión.';
      case 'notFound':
        return 'No encontramos este contenido. Puede que haya sido movido o eliminado.';
      case 'server':
        return 'Tuvimos un problema en el servidor. Inténtalo en unos minutos.';
      default:
        return error.message;
    }
  }
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}
