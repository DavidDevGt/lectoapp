import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { AccountLockedError, AuthenticationError, ConflictError } from '../../../src/shared/errors';
import * as passwordUtils from '../../../src/shared/utils/password';
import { PrismaMockClient } from '../../helpers/prisma-mock';

function buildUser(overrides: Partial<Record<string, unknown>> = {}) {
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

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: PrismaMockClient;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      refreshToken: {
        create: vi.fn().mockResolvedValue({}),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
    };
    service = new AuthService(prismaMock);
  });

  describe('register', () => {
    it('should create a user and return tokens when email is not taken', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const newUser = buildUser();
      prismaMock.user.create.mockResolvedValue(newUser);

      const result = await service.register({
        name: 'María López',
        email: 'maria@ejemplo.com',
        password: 'MiPassword123!',
      });

      expect(result.user.email).toBe('maria@ejemplo.com');
      expect(result.accessToken).toBeTypeOf('string');
      expect(result.refreshToken).toBeTypeOf('string');
      expect(prismaMock.refreshToken.create).toHaveBeenCalledOnce();
    });

    it('should throw ConflictError when email is already registered', async () => {
      prismaMock.user.findUnique.mockResolvedValue(buildUser());

      await expect(
        service.register({ name: 'María López', email: 'maria@ejemplo.com', password: 'MiPassword123!' }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    it('should throw AuthenticationError when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexiste@ejemplo.com', password: 'whatever' }),
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw AccountLockedError when the account is currently locked', async () => {
      const lockedUser = buildUser({ lockedUntil: new Date(Date.now() + 60_000) });
      prismaMock.user.findUnique.mockResolvedValue(lockedUser);

      await expect(service.login({ email: lockedUser.email, password: 'x' })).rejects.toThrow(
        AccountLockedError,
      );
    });

    it('should increment failedLoginAttempts and lock the account on the 5th failed attempt', async () => {
      const user = buildUser({ failedLoginAttempts: 4 });
      prismaMock.user.findUnique.mockResolvedValue(user);
      vi.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(false);

      await expect(service.login({ email: user.email, password: 'wrong' })).rejects.toThrow(
        AuthenticationError,
      );

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: expect.any(Date) },
      });
    });

    it('should return tokens and reset failed attempts on successful login', async () => {
      const user = buildUser({ failedLoginAttempts: 2 });
      prismaMock.user.findUnique.mockResolvedValue(user);
      vi.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(true);

      const result = await service.login({ email: user.email, password: 'MiPassword123!' });

      expect(result.accessToken).toBeTypeOf('string');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null, lastActiveAt: expect.any(Date) },
      });
    });
  });

  describe('logout', () => {
    it('should revoke all active refresh tokens for the user', async () => {
      await service.logout('user-1');

      expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRevoked: false },
        data: { isRevoked: true },
      });
    });
  });

  // ── Hardener: mutant-killing tests ──────────────────────────────────────────

  describe('login lockout boundary', () => {
    it('should lock the account on exactly the 5th failed attempt (>= not >)', async () => {
      // failedLoginAttempts starts at 4 → after this failure it becomes 5 → must lock
      // A mutation changing >= to > would allow a 6th attempt without locking.
      const user = buildUser({ failedLoginAttempts: 4 });
      prismaMock.user.findUnique.mockResolvedValue(user);
      vi.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(false);

      await expect(service.login({ email: user.email, password: 'wrong' })).rejects.toThrow(
        AuthenticationError,
      );

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,      // reset to 0 when locking
          lockedUntil: expect.any(Date),
        },
      });

      const updateArgs = prismaMock.user.update.mock.calls[0][0];
      // lockedUntil must be in the future — confirms it's a real lockout date
      expect(updateArgs.data.lockedUntil.getTime()).toBeGreaterThan(Date.now());
    });

    it('should allow login when lockedUntil has already expired', async () => {
      // Account was locked but the lock period has passed (lockedUntil in the past)
      const expiredLockUser = buildUser({
        lockedUntil: new Date(Date.now() - 1000), // 1 second in the past
        failedLoginAttempts: 0,
      });
      prismaMock.user.findUnique.mockResolvedValue(expiredLockUser);
      vi.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(true);

      // Must not throw AccountLockedError — the lock has expired
      const result = await service.login({ email: expiredLockUser.email, password: 'MiPassword123!' });

      expect(result.accessToken).toBeTypeOf('string');
    });
  });
});

