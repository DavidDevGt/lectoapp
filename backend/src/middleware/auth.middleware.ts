import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../generated/prisma';
import { AuthenticationError, AuthorizationError } from '../shared/errors';
import { verifyAccessToken } from '../shared/utils/jwt';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new AuthenticationError('Token de acceso ausente');
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    throw new AuthenticationError('Token de acceso inválido o expirado');
  }
}

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError();
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError();
    }

    next();
  };
}
