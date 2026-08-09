import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../../src/modules/auth/auth.service';
import { ReadingService } from '../../src/modules/readings/reading.service';
import { QuestionService } from '../../src/modules/questions/question.service';
import { UserRole } from '../../src/generated/prisma';
import type { PrismaMockClient } from '../helpers/prisma-mock';
import * as passwordUtils from '../../src/shared/utils/password';

/**
 * Lado productor del contrato de API (ver contracts/api.contract.json).
 *
 * Ejercita los servicios reales con Prisma mockeado y compara los campos que
 * efectivamente serializan contra el contrato. Si un DTO cambia de forma, este
 * test falla antes de que el panel admin se entere en producción.
 */

interface ApiContract {
  version: number;
  entities: Record<string, string[]>;
}

const contractPath = resolve(__dirname, '../../../contracts/api.contract.json');
const contract = JSON.parse(readFileSync(contractPath, 'utf-8')) as ApiContract;

function keysOf(value: object): string[] {
  return Object.keys(value).sort();
}

function expectedKeys(entity: string): string[] {
  const keys = contract.entities[entity];
  if (!keys) throw new Error(`El contrato no define la entidad "${entity}"`);
  return [...keys].sort();
}

function buildPrismaUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'admin@ejemplo.com',
    password: 'hashed-password',
    name: 'Administrador',
    role: UserRole.ADMIN,
    avatarUrl: null,
    gradeLevel: null,
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

function buildPrismaQuestion(overrides: Record<string, unknown> = {}) {
  return {
    id: 'question-1',
    readingId: 'reading-1',
    statement: '¿Qué animal es el símbolo nacional de Guatemala?',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'a', text: 'El quetzal' },
      { id: 'b', text: 'El jaguar' },
    ],
    correctAnswer: 'a',
    explanation: null,
    order: 1,
    isAiGenerated: false,
    status: 'DRAFT',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildPrismaReading(overrides: Record<string, unknown> = {}) {
  return {
    id: 'reading-1',
    title: 'El quetzal y la montaña',
    content: 'Contenido de la lectura.',
    comprehensionLevel: 'LITERAL',
    progressionLevel: 'BEGINNER',
    status: 'DRAFT',
    coverImageUrl: null,
    estimatedTimeMin: 5,
    order: 1,
    authorId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

describe('contrato de API — lado backend', () => {
  let prismaMock: PrismaMockClient;

  beforeEach(() => {
    prismaMock = {
      user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
      refreshToken: {
        create: vi.fn().mockResolvedValue({}),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      reading: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn() },
      question: { findMany: vi.fn() },
    };
  });

  it('AuthUser serializado por AuthService.login coincide con el contrato', async () => {
    vi.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(true);
    prismaMock.user.findUnique.mockResolvedValue(buildPrismaUser());
    prismaMock.user.update.mockResolvedValue(buildPrismaUser());

    const service = new AuthService(prismaMock);
    const result = await service.login({ email: 'admin@ejemplo.com', password: 'Password123!' });

    expect(keysOf(result.user)).toEqual(expectedKeys('AuthUser'));
  });

  it('ReadingListItem serializado por ReadingService.findAll coincide con el contrato', async () => {
    prismaMock.reading.findMany.mockResolvedValue([
      { ...buildPrismaReading(), _count: { questions: 3 } },
    ]);
    prismaMock.reading.count.mockResolvedValue(1);

    const service = new ReadingService(prismaMock);
    const result = await service.findAll(
      { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' },
      UserRole.ADMIN,
    );

    expect(result.items).toHaveLength(1);
    expect(keysOf(result.items[0] as object)).toEqual(expectedKeys('ReadingListItem'));
  });

  it('ReadingDetail serializado por ReadingService.findById coincide con el contrato', async () => {
    prismaMock.reading.findFirst.mockResolvedValue({
      ...buildPrismaReading(),
      author: { id: 'user-1', name: 'Administrador' },
      questions: [buildPrismaQuestion()],
    });

    const service = new ReadingService(prismaMock);
    const detail = await service.findById('reading-1', UserRole.ADMIN);

    expect(keysOf(detail)).toEqual(expectedKeys('ReadingDetail'));
  });

  it('AdminQuestion serializado por QuestionService coincide con el contrato', async () => {
    prismaMock.reading.findFirst.mockResolvedValue(buildPrismaReading());
    prismaMock.question.findMany.mockResolvedValue([buildPrismaQuestion()]);

    const service = new QuestionService(prismaMock);
    const questions = await service.findAllByReading('reading-1', UserRole.ADMIN, {});

    expect(questions).toHaveLength(1);
    expect(keysOf(questions[0] as object)).toEqual(expectedKeys('AdminQuestion'));
  });
});
