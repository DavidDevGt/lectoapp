import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from '../../../src/modules/auth/auth.validator';

describe('registerSchema', () => {
  const validInput = {
    name: 'María López',
    email: 'maria@ejemplo.com',
    password: 'MiPassword123!',
  };

  it('debería aceptar input válido', () => {
    const result = registerSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('debería aceptar gradeLevel opcional', () => {
    const result = registerSchema.safeParse({ ...validInput, gradeLevel: '5to Primaria' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gradeLevel).toBe('5to Primaria');
    }
  });

  it('debería rechazar nombre con menos de 2 caracteres', () => {
    const result = registerSchema.safeParse({ ...validInput, name: 'A' });
    expect(result.success).toBe(false);
  });

  it('debería rechazar nombre con más de 100 caracteres', () => {
    const result = registerSchema.safeParse({ ...validInput, name: 'A'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('debería rechazar email inválido', () => {
    const result = registerSchema.safeParse({ ...validInput, email: 'no-es-email' });
    expect(result.success).toBe(false);
  });

  it('debería rechazar password con menos de 8 caracteres', () => {
    const result = registerSchema.safeParse({ ...validInput, password: 'corta' });
    expect(result.success).toBe(false);
  });

  it('debería aceptar password con exactamente 8 caracteres (boundary)', () => {
    const result = registerSchema.safeParse({ ...validInput, password: '12345678' });
    expect(result.success).toBe(true);
  });
});

describe('loginSchema', () => {
  it('debería aceptar input válido', () => {
    const result = loginSchema.safeParse({ email: 'test@test.com', password: 'pass123' });
    expect(result.success).toBe(true);
  });

  it('debería rechazar email inválido', () => {
    const result = loginSchema.safeParse({ email: 'no-email', password: 'pass123' });
    expect(result.success).toBe(false);
  });

  it('debería rechazar password vacío', () => {
    const result = loginSchema.safeParse({ email: 'test@test.com', password: '' });
    expect(result.success).toBe(false);
  });

  it('debería rechazar input sin email', () => {
    const result = loginSchema.safeParse({ password: 'pass123' });
    expect(result.success).toBe(false);
  });

  it('debería rechazar input sin password', () => {
    const result = loginSchema.safeParse({ email: 'test@test.com' });
    expect(result.success).toBe(false);
  });
});

describe('refreshSchema', () => {
  it('debería aceptar refreshToken válido', () => {
    const result = refreshSchema.safeParse({ refreshToken: 'abc123-token' });
    expect(result.success).toBe(true);
  });

  it('debería rechazar refreshToken vacío', () => {
    const result = refreshSchema.safeParse({ refreshToken: '' });
    expect(result.success).toBe(false);
  });

  /**
   * `refreshToken` es opcional a nivel de schema: en modo cookie el body llega
   * vacío a propósito porque el token viaja en la cookie HttpOnly, no en el
   * cuerpo. Zod solo valida la FORMA; que el token exista por uno u otro canal
   * lo exige el controller (ver auth.cookie.ts → readRefreshToken), no este
   * validator — cubierto en tests/modules/auth/auth.routes.test.ts
   * ('responde 401 cuando no llega token por ningún canal').
   */
  it('debería aceptar input sin refreshToken — lo exige el controller, no el schema', () => {
    const result = refreshSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
