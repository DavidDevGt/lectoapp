import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '../../../src/modules/users/user.service';
import { NotFoundError } from '../../../src/shared/errors';

function buildUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'user-1',
    name: 'Carlos García',
    email: 'carlos@ejemplo.com',
    password: 'hashed-password',
    role: 'STUDENT',
    avatarUrl: null,
    gradeLevel: '4to Primaria',
    currentLevel: 'BEGINNER',
    totalPoints: 120,
    streak: 3,
    lastActiveAt: new Date(),
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-02-20'),
    deletedAt: null,
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaMock = any;

describe('UserService', () => {
  let service: UserService;
  let prismaMock: PrismaMock;

  beforeEach(() => {
    prismaMock = {
      user: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
    };
    service = new UserService(prismaMock);
  });

  // ── findById ──────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('debería retornar el perfil del usuario cuando existe', async () => {
      prismaMock.user.findFirst.mockResolvedValue(buildUser());

      const result = await service.findById('user-1');

      expect(result.id).toBe('user-1');
      expect(result.name).toBe('Carlos García');
      expect(result.email).toBe('carlos@ejemplo.com');
      // No debe exponer campos sensibles
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('failedLoginAttempts');
      expect(result).not.toHaveProperty('lockedUntil');
    });

    it('debería lanzar NotFoundError cuando el usuario no existe', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(service.findById('inexistente')).rejects.toThrow(NotFoundError);
    });

    it('debería filtrar usuarios con soft-delete (deletedAt != null)', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(service.findById('deleted-user')).rejects.toThrow(NotFoundError);

      // Verifica que la query incluye deletedAt: null
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'deleted-user', deletedAt: null },
      });
    });
  });

  // ── updateMe ──────────────────────────────────────────────────────────────

  describe('updateMe', () => {
    it('debería actualizar y retornar el perfil actualizado', async () => {
      prismaMock.user.findFirst.mockResolvedValue(buildUser());
      prismaMock.user.update.mockResolvedValue(
        buildUser({ name: 'Carlos Actualizado' }),
      );

      const result = await service.updateMe('user-1', { name: 'Carlos Actualizado' });

      expect(result.name).toBe('Carlos Actualizado');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'Carlos Actualizado' },
      });
    });

    it('debería lanzar NotFoundError si el usuario no existe', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(
        service.updateMe('inexistente', { name: 'Nuevo Nombre' }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('debería retornar resultados paginados', async () => {
      const users = [buildUser(), buildUser({ id: 'user-2', name: 'Ana' })];
      prismaMock.user.findMany.mockResolvedValue(users);
      prismaMock.user.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(2);
    });

    it('debería filtrar por rol cuando se especifica', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, role: 'ADMIN' });

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: 'ADMIN' }),
        }),
      );
    });

    it('debería buscar por nombre o email cuando se proporciona search', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, search: 'carlos' });

      const callArgs = prismaMock.user.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toBeDefined();
      expect(callArgs.where.OR).toEqual([
        { name: { contains: 'carlos', mode: 'insensitive' } },
        { email: { contains: 'carlos', mode: 'insensitive' } },
      ]);
    });

    it('debería calcular el skip correcto para paginación', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.count.mockResolvedValue(0);

      await service.findAll({ page: 3, limit: 10 });

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3-1) * 10
          take: 10,
        }),
      );
    });

    it('debería excluir usuarios con deletedAt != null', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20 });

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        }),
      );
    });
  });
});
