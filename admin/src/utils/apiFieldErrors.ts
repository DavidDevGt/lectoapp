import { ApiError } from '../services/api-client';

export type FieldErrorMap = Record<string, string>;

/**
 * Convierte los errores por campo que devuelve el backend en un mapa que un
 * formulario puede pintar junto a cada input.
 *
 * El backend ya enviaba `details` y el cliente ya los recibía en `ApiError`,
 * pero ninguna pantalla los leía: el administrador veía "Datos inválidos" sin
 * saber qué campo corregir.
 *
 * Devuelve un mapa vacío si el error no es de validación, para que quien llama
 * pueda decidir mostrar un toast genérico.
 */
export function toFieldErrors(error: unknown): FieldErrorMap {
  if (!(error instanceof ApiError) || !error.details) return {};

  const fieldErrors: FieldErrorMap = {};
  for (const detail of error.details) {
    // Zod anida las rutas ("options.0.text"); el formulario registra el campo
    // por su nombre completo, así que se conserva tal cual llega.
    if (detail.field && !fieldErrors[detail.field]) {
      fieldErrors[detail.field] = detail.message;
    }
  }
  return fieldErrors;
}

export function hasFieldErrors(fieldErrors: FieldErrorMap): boolean {
  return Object.keys(fieldErrors).length > 0;
}
