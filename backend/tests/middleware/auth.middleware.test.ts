import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../src/middleware/auth.middleware';
import { AuthenticationError, AuthorizationError } from '../../src/shared/errors';
import * as jwt from '../../src/shared/utils/jwt';

// Mock de la utilidad JWT para aislar los tests del middleware
vi.mock('../../src/shared/utils/jwt');

function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    user: undefined,
    ...overrides,
  } as unknown as Request;
}

function createMockResponse(): Response {
  return {} as Response;
}

describe('authenticate middleware', () => {
  const next: NextFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería setear req.user cuando el token es válido', () => {
    const payload = { sub: 'user-1', role: 'ADMIN' as const };
    vi.mocked(jwt.verifyAccessToken).mockReturnValue(payload);

    const req = createMockRequest({
      headers: { authorization: 'Bearer valid-token' },
    });
    const res = createMockResponse();

    authenticate(req, res, next);

    expect(req.user).toEqual({ id: 'user-1', role: 'ADMIN' });
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it('debería lanzar AuthenticationError cuando falta el header Authorization', () => {
    const req = createMockRequest({ headers: {} });
    const res = createMockResponse();

    expect(() => authenticate(req, res, next)).toThrow(AuthenticationError);
    expect(next).not.toHaveBeenCalled();
  });

  it('debería lanzar AuthenticationError cuando el header no empieza con Bearer', () => {
    const req = createMockRequest({
      headers: { authorization: 'Basic abc123' },
    });
    const res = createMockResponse();

    expect(() => authenticate(req, res, next)).toThrow(AuthenticationError);
  });

  it('debería lanzar AuthenticationError cuando el token es inválido', () => {
    vi.mocked(jwt.verifyAccessToken).mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    const req = createMockRequest({
      headers: { authorization: 'Bearer invalid-token' },
    });
    const res = createMockResponse();

    expect(() => authenticate(req, res, next)).toThrow(AuthenticationError);
  });

  it('debería lanzar AuthenticationError cuando el token expiró', () => {
    vi.mocked(jwt.verifyAccessToken).mockImplementation(() => {
      throw new Error('jwt expired');
    });

    const req = createMockRequest({
      headers: { authorization: 'Bearer expired-token' },
    });
    const res = createMockResponse();

    expect(() => authenticate(req, res, next)).toThrow(AuthenticationError);
  });
});

describe('authorize middleware', () => {
  const next: NextFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería llamar next() cuando el rol del usuario está permitido', () => {
    const req = createMockRequest();
    req.user = { id: 'user-1', role: 'ADMIN' };
    const res = createMockResponse();

    const middleware = authorize('ADMIN');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it('debería lanzar AuthorizationError cuando el rol no está permitido', () => {
    const req = createMockRequest();
    req.user = { id: 'user-1', role: 'STUDENT' };
    const res = createMockResponse();

    const middleware = authorize('ADMIN');

    expect(() => middleware(req, res, next)).toThrow(AuthorizationError);
  });

  it('debería lanzar AuthenticationError cuando req.user no existe', () => {
    const req = createMockRequest();
    const res = createMockResponse();

    const middleware = authorize('ADMIN');

    expect(() => middleware(req, res, next)).toThrow(AuthenticationError);
  });

  it('debería aceptar múltiples roles permitidos', () => {
    const req = createMockRequest();
    req.user = { id: 'user-1', role: 'STUDENT' };
    const res = createMockResponse();

    const middleware = authorize('ADMIN', 'STUDENT');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
