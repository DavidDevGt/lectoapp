import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { errorHandler, notFoundHandler } from '../../src/middleware/error.middleware';
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
} from '../../src/shared/errors';

// Mock del logger para evitar output en los tests
vi.mock('../../src/config/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    path: '/api/test',
    method: 'GET',
    ...overrides,
  } as unknown as Request;
}

function createMockResponse(): Response & { statusCode: number; body: unknown } {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe('errorHandler', () => {
  const next: NextFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería manejar ValidationError con status 400 y details', () => {
    const details = [{ field: 'email', message: 'Email inválido' }];
    const err = new ValidationError('Error de validación', details);
    const req = createMockRequest();
    const res = createMockResponse();

    errorHandler(err, req, res as unknown as Response, next);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      data: null,
      error: 'Error de validación',
      details,
    });
  });

  it('debería manejar ValidationError sin details', () => {
    const err = new ValidationError('Campo requerido');
    const req = createMockRequest();
    const res = createMockResponse();

    errorHandler(err, req, res as unknown as Response, next);

    expect(res.statusCode).toBe(400);
    const body = res.body as Record<string, unknown>;
    expect(body.error).toBe('Campo requerido');
    expect(body).not.toHaveProperty('details');
  });

  it('debería manejar AppError genérico con su statusCode', () => {
    const err = new NotFoundError('Recurso no encontrado');
    const req = createMockRequest();
    const res = createMockResponse();

    errorHandler(err, req, res as unknown as Response, next);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      success: false,
      data: null,
      error: 'Recurso no encontrado',
    });
  });

  it('debería manejar AuthenticationError con status 401', () => {
    const err = new AuthenticationError();
    const req = createMockRequest();
    const res = createMockResponse();

    errorHandler(err, req, res as unknown as Response, next);

    expect(res.statusCode).toBe(401);
  });

  it('debería manejar ZodError con status 400 y format de details', () => {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
    });

    const parseResult = schema.safeParse({ name: 'A', email: 'no-email' });
    // safeParse retorna un objeto con success false y error ZodError
    if (parseResult.success) throw new Error('Se esperaba un error de validación');

    const req = createMockRequest();
    const res = createMockResponse();

    errorHandler(parseResult.error, req, res as unknown as Response, next);

    expect(res.statusCode).toBe(400);
    const body = res.body as Record<string, unknown>;
    expect(body.success).toBe(false);
    expect(body.error).toBe('Errores de validación');
    expect(Array.isArray(body.details)).toBe(true);
    const details = body.details as { field: string; message: string }[];
    expect(details.length).toBeGreaterThanOrEqual(2);
    expect(details.every((d) => 'field' in d && 'message' in d)).toBe(true);
  });

  it('debería manejar Error genérico con status 500 sin exponer stack', () => {
    const err = new Error('Something exploded');
    const req = createMockRequest();
    const res = createMockResponse();

    errorHandler(err, req, res as unknown as Response, next);

    expect(res.statusCode).toBe(500);
    const body = res.body as Record<string, unknown>;
    expect(body.error).toBe('Error interno del servidor');
    // No debe exponer el mensaje original ni el stack
    expect(body.error).not.toContain('exploded');
    expect(body).not.toHaveProperty('stack');
  });
});

describe('notFoundHandler', () => {
  it('debería retornar 404 con la ruta en el mensaje', () => {
    const req = createMockRequest({ method: 'GET', path: '/api/nonexistent' });
    const res = createMockResponse();

    notFoundHandler(req, res as unknown as Response);

    expect(res.statusCode).toBe(404);
    const body = res.body as Record<string, unknown>;
    expect(body.success).toBe(false);
    expect(body.error).toContain('GET');
    expect(body.error).toContain('/api/nonexistent');
  });

  it('debería incluir el método HTTP en el mensaje', () => {
    const req = createMockRequest({ method: 'POST', path: '/api/missing' });
    const res = createMockResponse();

    notFoundHandler(req, res as unknown as Response);

    const body = res.body as Record<string, unknown>;
    expect(body.error).toContain('POST');
  });
});
