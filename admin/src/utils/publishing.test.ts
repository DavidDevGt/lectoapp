import { describe, it, expect } from 'vitest';
import { MIN_APPROVED_QUESTIONS_TO_PUBLISH } from './publishing';

describe('publishing', () => {
  it('debería requerir exactamente 5 preguntas aprobadas para publicar', () => {
    // Snapshot de la regla de negocio central — si alguien cambia este valor
    // en el frontend sin actualizar el backend, este test fallará.
    expect(MIN_APPROVED_QUESTIONS_TO_PUBLISH).toBe(5);
  });

  it('debería ser un número entero positivo', () => {
    expect(Number.isInteger(MIN_APPROVED_QUESTIONS_TO_PUBLISH)).toBe(true);
    expect(MIN_APPROVED_QUESTIONS_TO_PUBLISH).toBeGreaterThan(0);
  });
});
