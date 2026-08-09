import { describe, it, expect } from 'vitest';
import {
  createReadingSchema,
  updateReadingSchema,
  readingQuerySchema,
} from '../../../src/modules/readings/reading.validator';

describe('createReadingSchema', () => {
  const validInput = {
    title: 'El Popol Vuh',
    content: 'x'.repeat(50), // mínimo 50 caracteres
    comprehensionLevel: 'LITERAL' as const,
    progressionLevel: 'BEGINNER' as const,
  };

  it('debería aceptar input válido con campos requeridos', () => {
    const result = createReadingSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('debería aceptar campos opcionales', () => {
    const result = createReadingSchema.safeParse({
      ...validInput,
      coverImageUrl: 'https://ejemplo.com/imagen.png',
      estimatedTimeMin: 10,
      order: 1,
    });
    expect(result.success).toBe(true);
  });

  // ── Título ──────────────────────────────────────────────────────────────

  it('debería rechazar título con menos de 3 caracteres', () => {
    const result = createReadingSchema.safeParse({ ...validInput, title: 'AB' });
    expect(result.success).toBe(false);
  });

  it('debería aceptar título con exactamente 3 caracteres (boundary)', () => {
    const result = createReadingSchema.safeParse({ ...validInput, title: 'ABC' });
    expect(result.success).toBe(true);
  });

  it('debería rechazar título con más de 200 caracteres', () => {
    const result = createReadingSchema.safeParse({ ...validInput, title: 'A'.repeat(201) });
    expect(result.success).toBe(false);
  });

  // ── Contenido ───────────────────────────────────────────────────────────

  it('debería rechazar contenido con menos de 50 caracteres', () => {
    const result = createReadingSchema.safeParse({ ...validInput, content: 'corto' });
    expect(result.success).toBe(false);
  });

  it('debería aceptar contenido con exactamente 50 caracteres (boundary)', () => {
    const result = createReadingSchema.safeParse({ ...validInput, content: 'A'.repeat(50) });
    expect(result.success).toBe(true);
  });

  // ── Enums ───────────────────────────────────────────────────────────────

  it('debería rechazar comprehensionLevel inválido', () => {
    const result = createReadingSchema.safeParse({
      ...validInput,
      comprehensionLevel: 'INVALID',
    });
    expect(result.success).toBe(false);
  });

  it('debería aceptar todos los comprehensionLevels válidos', () => {
    for (const level of ['LITERAL', 'INFERENTIAL', 'CRITICAL']) {
      const result = createReadingSchema.safeParse({
        ...validInput,
        comprehensionLevel: level,
      });
      expect(result.success).toBe(true);
    }
  });

  it('debería rechazar progressionLevel inválido', () => {
    const result = createReadingSchema.safeParse({
      ...validInput,
      progressionLevel: 'NOVICE',
    });
    expect(result.success).toBe(false);
  });

  it('debería aceptar todos los progressionLevels válidos', () => {
    for (const level of ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'SUPREME']) {
      const result = createReadingSchema.safeParse({
        ...validInput,
        progressionLevel: level,
      });
      expect(result.success).toBe(true);
    }
  });

  // ── Coerción de tipos ─────────────────────────────────────────────────

  it('debería coercionar estimatedTimeMin de string a número', () => {
    const result = createReadingSchema.safeParse({
      ...validInput,
      estimatedTimeMin: '15',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.estimatedTimeMin).toBe(15);
    }
  });

  it('debería rechazar estimatedTimeMin negativo', () => {
    const result = createReadingSchema.safeParse({
      ...validInput,
      estimatedTimeMin: -1,
    });
    expect(result.success).toBe(false);
  });

  it('debería rechazar coverImageUrl que no es URL válida', () => {
    const result = createReadingSchema.safeParse({
      ...validInput,
      coverImageUrl: 'no-es-url',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateReadingSchema', () => {
  it('debería aceptar un subset de campos (partial)', () => {
    const result = updateReadingSchema.safeParse({ title: 'Nuevo título' });
    expect(result.success).toBe(true);
  });

  it('debería aceptar objeto vacío (todo es opcional)', () => {
    const result = updateReadingSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('debería rechazar un campo con valor inválido', () => {
    const result = updateReadingSchema.safeParse({ title: 'AB' }); // mín 3
    expect(result.success).toBe(false);
  });
});

describe('readingQuerySchema', () => {
  it('debería aplicar defaults cuando no se envían query params', () => {
    const result = readingQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sortBy).toBe('createdAt');
      expect(result.data.sortOrder).toBe('desc');
    }
  });

  it('debería coercionar page y limit de string a número', () => {
    const result = readingQuerySchema.safeParse({ page: '3', limit: '10' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(10);
    }
  });

  it('debería rechazar limit mayor a 100', () => {
    const result = readingQuerySchema.safeParse({ limit: '101' });
    expect(result.success).toBe(false);
  });

  it('debería rechazar page 0 o negativo', () => {
    expect(readingQuerySchema.safeParse({ page: '0' }).success).toBe(false);
    expect(readingQuerySchema.safeParse({ page: '-1' }).success).toBe(false);
  });

  it('debería aceptar filtros opcionales de status y niveles', () => {
    const result = readingQuerySchema.safeParse({
      status: 'PUBLISHED',
      comprehensionLevel: 'CRITICAL',
      progressionLevel: 'ADVANCED',
    });
    expect(result.success).toBe(true);
  });

  it('debería rechazar sortBy con valor no permitido', () => {
    const result = readingQuerySchema.safeParse({ sortBy: 'invalidField' });
    expect(result.success).toBe(false);
  });
});
