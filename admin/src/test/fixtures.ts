import {
  AdminQuestion,
  AuthResult,
  AuthUser,
  DashboardStats,
  ReadingDetail,
  ReadingListItem,
} from '../types/api';

/**
 * Typed builders for test data. Every fixture is annotated with the real domain
 * type, so a change in `types/api.ts` (or a drift against the backend DTO) breaks
 * `tsc` instead of silently producing tests that pass against a shape that does
 * not exist. Tests must build data through these helpers rather than inlining
 * object literals — inline literals were how `LoginPage.test.tsx` ended up
 * asserting on fields the API never returns.
 */

export function buildAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    name: 'Administrador',
    email: 'admin@example.com',
    role: 'ADMIN',
    currentLevel: 'BEGINNER',
    totalPoints: 0,
    streak: 0,
    ...overrides,
  };
}

export function buildAuthResult(overrides: Partial<AuthResult> = {}): AuthResult {
  return {
    user: buildAuthUser(),
    accessToken: 'access-token',
    ...overrides,
  };
}

export function buildReadingListItem(overrides: Partial<ReadingListItem> = {}): ReadingListItem {
  return {
    id: 'reading-1',
    title: 'El quetzal y la montaña',
    comprehensionLevel: 'LITERAL',
    progressionLevel: 'BEGINNER',
    status: 'DRAFT',
    coverImageUrl: null,
    estimatedTimeMin: 5,
    questionsCount: 0,
    createdAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

export function buildReadingDetail(overrides: Partial<ReadingDetail> = {}): ReadingDetail {
  return {
    id: 'reading-1',
    title: 'El quetzal y la montaña',
    content: 'Contenido de la lectura con la extensión suficiente para superar la validación mínima.',
    comprehensionLevel: 'LITERAL',
    progressionLevel: 'BEGINNER',
    status: 'DRAFT',
    coverImageUrl: null,
    estimatedTimeMin: 5,
    order: 1,
    questions: [],
    author: { id: 'user-1', name: 'Administrador' },
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

export function buildAdminQuestion(overrides: Partial<AdminQuestion> = {}): AdminQuestion {
  return {
    id: 'question-1',
    statement: '¿Qué animal es el símbolo nacional de Guatemala?',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'a', text: 'El quetzal' },
      { id: 'b', text: 'El jaguar' },
      { id: 'c', text: 'El colibrí' },
      { id: 'd', text: 'La guacamaya' },
    ],
    correctAnswer: 'a',
    explanation: null,
    order: 1,
    isAiGenerated: false,
    status: 'DRAFT',
    ...overrides,
  };
}

export function buildDashboardStats(overrides: Partial<DashboardStats> = {}): DashboardStats {
  return {
    readings: { total: 0, byStatus: { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 } },
    questions: { total: 0, byStatus: { DRAFT: 0, APPROVED: 0 } },
    students: {
      total: 0,
      active: 0,
      activeWithinDays: 30,
      byProgressionLevel: {
        BEGINNER: 0,
        INTERMEDIATE: 0,
        ADVANCED: 0,
        EXPERT: 0,
        SUPREME: 0,
      },
    },
    quizAttempts: {
      total: 0,
      passed: 0,
      passRatePercentage: 0,
      averageScorePercentage: 0,
    },
    topReadings: [],
    ...overrides,
  };
}
