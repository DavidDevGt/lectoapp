interface ErrorContext {
  componentStack?: string;
  [key: string]: unknown;
}

type ErrorSink = (error: Error, context?: ErrorContext) => void;

/**
 * Punto único por donde salen los errores del cliente.
 *
 * Hoy escribe en la consola del navegador. Cuando se contrate un servicio de
 * telemetría (Sentry, GlitchTip self-hosted, etc.) basta con llamar a
 * `setErrorSink` una vez en `main.tsx` — ningún componente cambia. Se hace así
 * en lugar de importar el SDK directamente para no acoplar cada pantalla a un
 * proveedor que todavía no está decidido, y para que los tests no necesiten
 * mockearlo.
 */

const consoleSink: ErrorSink = (error, context) => {
  console.error('[LectoApp Admin]', error, context ?? {});
};

let sink: ErrorSink = consoleSink;

export function setErrorSink(next: ErrorSink): void {
  sink = next;
}

export function resetErrorSink(): void {
  sink = consoleSink;
}

const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'accesstoken', 'refreshtoken', 'secret'];

function sanitizeValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
    return '[REDACTED]';
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      sanitizedObj[k] = sanitizeValue(k, v);
    }
    return sanitizedObj;
  }
  return value;
}

function sanitizeContext(context?: ErrorContext): ErrorContext | undefined {
  if (!context) return undefined;
  return sanitizeValue('root', context) as ErrorContext;
}

export function reportError(error: unknown, context?: ErrorContext): void {
  const normalized = error instanceof Error ? error : new Error(String(error));
  const cleanContext = sanitizeContext(context);
  sink(normalized, cleanContext);
}
