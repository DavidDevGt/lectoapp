import { describe, it, expect } from 'vitest';
import { toFieldErrors, hasFieldErrors } from './apiFieldErrors';
import { ApiError } from '../services/api-client';

describe('toFieldErrors', () => {
  it('convierte los details del backend en un mapa por campo', () => {
    const error = new ApiError('Datos inválidos', 400, [
      { field: 'title', message: 'Mínimo 3 caracteres' },
      { field: 'content', message: 'Mínimo 50 caracteres' },
    ]);

    expect(toFieldErrors(error)).toEqual({
      title: 'Mínimo 3 caracteres',
      content: 'Mínimo 50 caracteres',
    });
  });

  it('conserva las rutas anidadas que envía Zod', () => {
    const error = new ApiError('Datos inválidos', 400, [
      { field: 'options.0.text', message: 'La opción no puede estar vacía' },
    ]);

    expect(toFieldErrors(error)).toEqual({ 'options.0.text': 'La opción no puede estar vacía' });
  });

  it('se queda con el primer mensaje cuando un campo trae varios', () => {
    const error = new ApiError('Datos inválidos', 400, [
      { field: 'title', message: 'Primero' },
      { field: 'title', message: 'Segundo' },
    ]);

    expect(toFieldErrors(error)).toEqual({ title: 'Primero' });
  });

  it('devuelve un mapa vacío cuando el error no trae details', () => {
    expect(toFieldErrors(new ApiError('Error del servidor', 500))).toEqual({});
  });

  it('devuelve un mapa vacío cuando el error no es un ApiError', () => {
    expect(toFieldErrors(new Error('boom'))).toEqual({});
    expect(toFieldErrors('boom')).toEqual({});
  });
});

describe('hasFieldErrors', () => {
  it('distingue un mapa con errores de uno vacío', () => {
    expect(hasFieldErrors({ title: 'x' })).toBe(true);
    expect(hasFieldErrors({})).toBe(false);
  });
});
