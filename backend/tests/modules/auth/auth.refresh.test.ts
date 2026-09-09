import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { AuthenticationError } from '../../../src/shared/errors';
import { hashRefreshToken } from '../../../src/shared/utils/token-hash';
import { signRefreshToken } from '../../../src/shared/utils/jwt';
import { PrismaMockClient } from '../../helpers/prisma-mock';

function buildUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'maria@ejemplo.com',
    password: 'hashed-password',
    name: 'María López',
    role: 'STUDENT',
    avatarUrl: null,
    gradeLevel: '5to Primaria',
    totalPoints: 0,
    currentLevel: 'BEGINNER',
    streak: 0,
    lastActiveAt: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function buildStoredToken(token: string, overrides: Record<string, unknown> = {}) {
  return {
    id: 'rt-1',
    tokenHash: hashRefreshToken(token),
    userId: 'user-1',
    family: 'family-1',
    isRevoked: false,
    expiresAt: new Date(Date.now() + 86_400_000),
    createdAt: new Date(),
    ...overrides,
  };
}

describe('AuthService — rotación de refresh tokens', () => {
  let service: AuthService;
  let prismaMock: PrismaMockClient;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: vi.fn().mockResolvedValue(buildUser()),
        create: vi.fn(),
        update: vi.fn(),
      },
      refreshToken: {
        create: vi.fn().mockResolvedValue({}),
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({}),
      },
    };
    service = new AuthService(prismaMock);
  });

  describe('almacenamiento del token', () => {
    /**
     * La tabla `refresh_tokens` guardaba el JWT en claro. Un volcado —un
     * respaldo mal guardado, acceso de solo lectura a Postgres— entregaba
     * sesiones vivas de siete días de todos los usuarios a la vez.
     */
    it('nunca guarda el JWT en claro, solo su SHA-256', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(buildUser());

      const result = await service.register({
        name: 'María López',
        email: 'maria@ejemplo.com',
        password: 'MiPassword123!',
      });

      const stored = prismaMock.refreshToken.create.mock.calls[0][0].data;

      expect(stored.tokenHash).toBe(hashRefreshToken(result.refreshToken));
      expect(stored.tokenHash).not.toBe(result.refreshToken);
      expect(stored).not.toHaveProperty('token');
      // El hash es hexadecimal de 64 caracteres; el JWT lleva puntos.
      expect(stored.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('el hash es determinista, para poder buscarlo por índice único', () => {
      const token = 'un.jwt.cualquiera';
      expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
      expect(hashRefreshToken(token)).not.toBe(hashRefreshToken(`${token}x`));
    });
  });

  describe('refresh exitoso', () => {
    it('busca el token por su hash, nunca por el valor en claro', async () => {
      const token = signRefreshToken({ sub: 'user-1', family: 'family-1' });
      prismaMock.refreshToken.findUnique.mockResolvedValue(buildStoredToken(token));

      await service.refresh(token);

      expect(prismaMock.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { tokenHash: hashRefreshToken(token) },
      });
    });

    it('revoca el token usado y emite uno nuevo en la misma familia', async () => {
      const token = signRefreshToken({ sub: 'user-1', family: 'family-1' });
      prismaMock.refreshToken.findUnique.mockResolvedValue(buildStoredToken(token));

      const result = await service.refresh(token);

      expect(prismaMock.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: { isRevoked: true },
      });
      expect(prismaMock.refreshToken.create.mock.calls[0][0].data.family).toBe('family-1');
      expect(result.accessToken).toBeTypeOf('string');
      expect(result.refreshToken).toBeTypeOf('string');
      expect(result.refreshToken).not.toBe(token);
    });
  });

  describe('detección de reutilización', () => {
    /**
     * Presentar un token ya rotado significa que alguien tiene una copia
     * antigua: o el cliente perdió la rotación, o el token fue robado. Ante la
     * duda se corta la familia entera.
     */
    it('revoca toda la familia cuando se reutiliza un token ya rotado', async () => {
      const token = signRefreshToken({ sub: 'user-1', family: 'family-1' });
      prismaMock.refreshToken.findUnique.mockResolvedValue(
        buildStoredToken(token, { isRevoked: true }),
      );

      await expect(service.refresh(token)).rejects.toThrow(AuthenticationError);

      expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { family: 'family-1', isRevoked: false },
        data: { isRevoked: true },
      });
      expect(prismaMock.refreshToken.create).not.toHaveBeenCalled();
    });

    it('no revoca la familia en una rotación normal', async () => {
      const token = signRefreshToken({ sub: 'user-1', family: 'family-1' });
      prismaMock.refreshToken.findUnique.mockResolvedValue(buildStoredToken(token));

      await service.refresh(token);

      expect(prismaMock.refreshToken.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('tokens inválidos', () => {
    it('rechaza un token que no verifica contra el secreto de refresh', async () => {
      await expect(service.refresh('no.es.un.jwt')).rejects.toThrow(AuthenticationError);
      expect(prismaMock.refreshToken.findUnique).not.toHaveBeenCalled();
    });

    it('rechaza un token que verifica pero no está en la base de datos', async () => {
      const token = signRefreshToken({ sub: 'user-1', family: 'family-1' });
      prismaMock.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh(token)).rejects.toThrow(AuthenticationError);
    });

    it('rechaza un token caducado en la base de datos', async () => {
      const token = signRefreshToken({ sub: 'user-1', family: 'family-1' });
      prismaMock.refreshToken.findUnique.mockResolvedValue(
        buildStoredToken(token, { expiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(service.refresh(token)).rejects.toThrow(AuthenticationError);
    });

    it('rechaza un token cuyo usuario ya no existe', async () => {
      const token = signRefreshToken({ sub: 'user-1', family: 'family-1' });
      prismaMock.refreshToken.findUnique.mockResolvedValue(buildStoredToken(token));
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh(token)).rejects.toThrow(AuthenticationError);
    });

    it('devuelve el mismo mensaje en todos los casos, sin distinguir la causa', async () => {
      const token = signRefreshToken({ sub: 'user-1', family: 'family-1' });

      prismaMock.refreshToken.findUnique.mockResolvedValue(null);
      const noExiste = await service.refresh(token).catch((e: Error) => e.message);

      prismaMock.refreshToken.findUnique.mockResolvedValue(
        buildStoredToken(token, { isRevoked: true }),
      );
      const revocado = await service.refresh(token).catch((e: Error) => e.message);

      expect(noExiste).toBe(revocado);
    });
  });
});
