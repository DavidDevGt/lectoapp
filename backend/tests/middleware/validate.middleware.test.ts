import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../src/middleware/validate.middleware';

function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: {},
    params: {},
    ...overrides,
  } as unknown as Request;
}

function createMockResponse(): Response {
  return {} as Response;
}

const testSchema = z.object({
  name: z.string().min(2),
  age: z.number().int().positive(),
});

describe('validate middleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  it('debería pasar la validación y parsear el body correctamente', () => {
    const req = createMockRequest({ body: { name: 'María', age: 25 } });
    const res = createMockResponse();

    const middleware = validate(testSchema, 'body');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(); // sin error
    expect(req.body).toEqual({ name: 'María', age: 25 });
  });

  it('debería llamar next con ZodError cuando la validación falla', () => {
    const req = createMockRequest({ body: { name: 'A', age: -5 } });
    const res = createMockResponse();

    const middleware = validate(testSchema, 'body');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(error).toBeInstanceOf(z.ZodError);
  });

  it('debería validar query params cuando source es "query"', () => {
    const querySchema = z.object({
      page: z.coerce.number().int().positive(),
    });

    const req = createMockRequest({ query: { page: '3' } });
    const res = createMockResponse();

    const middleware = validate(querySchema, 'query');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    // Zod coerce convierte el string a número
    expect(req.query).toEqual({ page: 3 });
  });

  it('debería validar params cuando source es "params"', () => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const req = createMockRequest({
      params: { id: '550e8400-e29b-41d4-a716-446655440000' },
    });
    const res = createMockResponse();

    const middleware = validate(paramsSchema, 'params');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('debería usar body como source por defecto', () => {
    const req = createMockRequest({ body: { name: 'Test', age: 10 } });
    const res = createMockResponse();

    // Sin segundo argumento — debería usar 'body'
    const middleware = validate(testSchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Test', age: 10 });
  });

  it('debería rechazar body vacío', () => {
    const req = createMockRequest({ body: {} });
    const res = createMockResponse();

    const middleware = validate(testSchema);
    middleware(req, res, next);

    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(error).toBeInstanceOf(z.ZodError);
  });
});
