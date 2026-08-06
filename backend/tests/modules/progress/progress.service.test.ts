import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProgressService } from '../../../src/modules/progress/progress.service';
import { NotFoundError, ValidationError } from '../../../src/shared/errors';

const READING = {
  id: 'reading-1',
  progressionLevel: 'BEGINNER',
  status: 'PUBLISHED',
  deletedAt: null,
};

const QUESTIONS = [
  { id: 'q1', correctAnswer: 'a', explanation: 'Explicación 1' },
  { id: 'q2', correctAnswer: 'b', explanation: 'Explicación 2' },
];

function buildUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'user-1',
    totalPoints: 0,
    currentLevel: 'BEGINNER',
    streak: 0,
    lastActiveAt: null,
    ...overrides,
  };
}

describe('ProgressService', () => {
  let service: ProgressService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      reading: { findFirst: vi.fn(), count: vi.fn() },
      question: { findMany: vi.fn() },
      quizAttempt: { create: vi.fn(), findMany: vi.fn() },
      studentProgress: { findUnique: vi.fn(), upsert: vi.fn(), count: vi.fn() },
      user: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
    };
    service = new ProgressService(prismaMock);

    prismaMock.reading.findFirst.mockResolvedValue(READING);
    prismaMock.question.findMany.mockResolvedValue(QUESTIONS);
    prismaMock.quizAttempt.create.mockResolvedValue({
      id: 'attempt-1',
      createdAt: new Date('2026-08-10T10:00:00Z'),
      timeSpentSec: 120,
    });
    prismaMock.reading.count.mockResolvedValue(5);
    prismaMock.studentProgress.count.mockResolvedValue(1);
    prismaMock.user.update.mockImplementation(({ data }: any) =>
      Promise.resolve(buildUser({ totalPoints: data.totalPoints?.increment ?? 0 })),
    );
  });

  it('should throw NotFoundError when the reading is not published', async () => {
    prismaMock.reading.findFirst.mockResolvedValue(null);

    await expect(
      service.submit('user-1', { readingId: 'missing', answers: [{ questionId: 'q1', selectedAnswer: 'a' }] }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw ValidationError when answers do not cover every approved question', async () => {
    await expect(
      service.submit('user-1', {
        readingId: 'reading-1',
        answers: [{ questionId: 'q1', selectedAnswer: 'a' }], // falta q2
      }),
    ).rejects.toThrow(ValidationError);

    expect(prismaMock.quizAttempt.create).not.toHaveBeenCalled();
  });

  it('should score correctly and award points on first-time completion', async () => {
    prismaMock.studentProgress.findUnique.mockResolvedValue(null);
    prismaMock.studentProgress.upsert.mockResolvedValue({
      bestScore: 100,
      attempts: 1,
      completed: true,
      completedAt: new Date('2026-08-10T10:00:00Z'),
    });
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(buildUser());

    const result = await service.submit('user-1', {
      readingId: 'reading-1',
      answers: [
        { questionId: 'q1', selectedAnswer: 'a' },
        { questionId: 'q2', selectedAnswer: 'b' },
      ],
      timeSpentSec: 120,
    });

    expect(result.attempt.score).toBe(2);
    expect(result.attempt.percentage).toBe(100);
    expect(result.attempt.passed).toBe(true);
    expect(result.progress.isNewCompletion).toBe(true);
    expect(result.rewards.pointsEarned).toBe(100);
    expect(result.rewards.levelUp).toBe(false); // reading.count=5, studentProgress.count=1 → aún no completa el nivel
  });

  it('should not award points again when the reading was already completed', async () => {
    prismaMock.studentProgress.findUnique.mockResolvedValue({
      completed: true,
      bestScore: 100,
      attempts: 1,
      completedAt: new Date('2026-08-01T10:00:00Z'),
    });
    prismaMock.studentProgress.upsert.mockResolvedValue({
      bestScore: 100,
      attempts: 2,
      completed: true,
      completedAt: new Date('2026-08-01T10:00:00Z'),
    });
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(buildUser({ totalPoints: 100 }));

    const result = await service.submit('user-1', {
      readingId: 'reading-1',
      answers: [
        { questionId: 'q1', selectedAnswer: 'a' },
        { questionId: 'q2', selectedAnswer: 'b' },
      ],
    });

    expect(result.progress.isNewCompletion).toBe(false);
    expect(result.rewards.pointsEarned).toBe(0);
  });

  it('should mark levelUp when every reading in the current level is completed', async () => {
    prismaMock.studentProgress.findUnique.mockResolvedValue(null);
    prismaMock.studentProgress.upsert.mockResolvedValue({
      bestScore: 100,
      attempts: 1,
      completed: true,
      completedAt: new Date('2026-08-10T10:00:00Z'),
    });
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(buildUser());
    prismaMock.reading.count.mockResolvedValue(1); // solo esta lectura en el nivel
    prismaMock.studentProgress.count.mockResolvedValue(1); // ya completada

    const result = await service.submit('user-1', {
      readingId: 'reading-1',
      answers: [
        { questionId: 'q1', selectedAnswer: 'a' },
        { questionId: 'q2', selectedAnswer: 'b' },
      ],
    });

    expect(result.rewards.levelUp).toBe(true);
    expect(result.rewards.newLevel).toBe('INTERMEDIATE');
  });

  it('should mark a failing attempt as not passed and not completed', async () => {
    prismaMock.studentProgress.findUnique.mockResolvedValue(null);
    prismaMock.studentProgress.upsert.mockResolvedValue({
      bestScore: 50,
      attempts: 1,
      completed: false,
      completedAt: null,
    });
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(buildUser());

    const result = await service.submit('user-1', {
      readingId: 'reading-1',
      answers: [
        { questionId: 'q1', selectedAnswer: 'a' },
        { questionId: 'q2', selectedAnswer: 'WRONG' },
      ],
    });

    expect(result.attempt.percentage).toBe(50);
    expect(result.attempt.passed).toBe(false); // 50% < umbral de 70%
    expect(result.rewards.pointsEarned).toBe(0);
  });

  // ── Hardener: mutant-killing tests ──────────────────────────────────────────

  it('should pass when percentage is exactly 70 (boundary >= not >)', async () => {
    // 7 correct out of 10 = exactly 70% — must be considered passed
    const tenQuestions = Array.from({ length: 10 }, (_, i) => ({
      id: `q${i + 1}`,
      correctAnswer: 'a',
      explanation: `Exp ${i + 1}`,
    }));
    prismaMock.question.findMany.mockResolvedValue(tenQuestions);
    prismaMock.studentProgress.findUnique.mockResolvedValue(null);
    prismaMock.studentProgress.upsert.mockResolvedValue({
      bestScore: 70,
      attempts: 1,
      completed: true,
      completedAt: new Date(),
    });
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(buildUser());

    const answers = tenQuestions.map((q, i) => ({
      questionId: q.id,
      selectedAnswer: i < 7 ? 'a' : 'WRONG', // 7/10 = 70%
    }));

    const result = await service.submit('user-1', { readingId: 'reading-1', answers });

    expect(result.attempt.percentage).toBe(70);
    expect(result.attempt.passed).toBe(true); // must be true at exactly 70%
  });

  it('should preserve bestScore on a retry with a lower score', async () => {
    // First attempt: 100%. Second attempt: 50%. bestScore must remain 100%.
    prismaMock.studentProgress.findUnique.mockResolvedValue({
      completed: true,
      bestScore: 100,
      attempts: 1,
      completedAt: new Date('2026-08-01T10:00:00Z'),
    });
    prismaMock.studentProgress.upsert.mockImplementation(({ update }: any) => {
      // Capture what bestScore value the service passes to upsert
      return Promise.resolve({
        bestScore: update.bestScore,
        attempts: 2,
        completed: true,
        completedAt: new Date('2026-08-01T10:00:00Z'),
      });
    });
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(buildUser({ totalPoints: 100 }));

    await service.submit('user-1', {
      readingId: 'reading-1',
      answers: [
        { questionId: 'q1', selectedAnswer: 'a' },      // correct
        { questionId: 'q2', selectedAnswer: 'WRONG' },   // wrong — 50%
      ],
    });

    const upsertCall = prismaMock.studentProgress.upsert.mock.calls[0][0];
    // Math.max(100, 50) = 100 — must NOT be replaced by current percentage (50)
    expect(upsertCall.update.bestScore).toBe(100);
  });

  it('should NOT set isNewCompletion=true when the attempt fails for an unvisited reading', async () => {
    // Reading never attempted before, but this attempt scores only 50% (fails)
    prismaMock.studentProgress.findUnique.mockResolvedValue(null); // never visited
    prismaMock.studentProgress.upsert.mockResolvedValue({
      bestScore: 50,
      attempts: 1,
      completed: false,
      completedAt: null,
    });
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(buildUser());

    const result = await service.submit('user-1', {
      readingId: 'reading-1',
      answers: [
        { questionId: 'q1', selectedAnswer: 'a' },      // correct
        { questionId: 'q2', selectedAnswer: 'WRONG' },   // wrong — 50% → not passed
      ],
    });

    // passed=false AND wasCompletedBefore=false → isNewCompletion MUST be false
    // A mutation `passed || !wasCompletedBefore` would make this true — this test kills it.
    expect(result.progress.isNewCompletion).toBe(false);
    expect(result.rewards.pointsEarned).toBe(0);
  });

  it('should NOT trigger level-up when the reading belongs to a different progression level than the user', async () => {
    // User is BEGINNER, but reading is INTERMEDIATE — completing it must not trigger level-up
    prismaMock.reading.findFirst.mockResolvedValue({
      id: 'reading-1',
      progressionLevel: 'INTERMEDIATE', // different from user's BEGINNER
      status: 'PUBLISHED',
      deletedAt: null,
    });
    prismaMock.studentProgress.findUnique.mockResolvedValue(null);
    prismaMock.studentProgress.upsert.mockResolvedValue({
      bestScore: 100,
      attempts: 1,
      completed: true,
      completedAt: new Date(),
    });
    prismaMock.user.findUniqueOrThrow.mockResolvedValue(buildUser({ currentLevel: 'BEGINNER' }));

    const result = await service.submit('user-1', {
      readingId: 'reading-1',
      answers: [
        { questionId: 'q1', selectedAnswer: 'a' },
        { questionId: 'q2', selectedAnswer: 'b' },
      ],
    });

    expect(result.rewards.levelUp).toBe(false);
    // checkLevelUp must never be called — reading level ≠ user level
    expect(prismaMock.reading.count).not.toHaveBeenCalled();
  });

  describe('computeStreak (via submit)', () => {
    // These tests indirectly test the private computeStreak method by inspecting
    // the `streak` value passed to user.update — confirms no mutation in day-diff logic survives.

    it('should increment streak by 1 when last activity was exactly yesterday', async () => {
      const now = new Date('2026-08-06T10:00:00Z');
      const yesterday = new Date('2026-08-05T20:00:00Z'); // same calendar day diff = 1

      prismaMock.quizAttempt.create.mockResolvedValue({
        id: 'attempt-x',
        createdAt: now,
        timeSpentSec: 60,
      });
      prismaMock.studentProgress.findUnique.mockResolvedValue(null);
      prismaMock.studentProgress.upsert.mockResolvedValue({
        bestScore: 100,
        attempts: 1,
        completed: true,
        completedAt: now,
      });
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        buildUser({ streak: 3, lastActiveAt: yesterday }),
      );

      await service.submit('user-1', {
        readingId: 'reading-1',
        answers: [
          { questionId: 'q1', selectedAnswer: 'a' },
          { questionId: 'q2', selectedAnswer: 'b' },
        ],
      });

      const updateCall = prismaMock.user.update.mock.calls[0][0];
      expect(updateCall.data.streak).toBe(4); // 3 + 1
    });

    it('should reset streak to 1 when last activity was 2+ days ago', async () => {
      const now = new Date('2026-08-06T10:00:00Z');
      const twoDaysAgo = new Date('2026-08-04T10:00:00Z');

      prismaMock.quizAttempt.create.mockResolvedValue({
        id: 'attempt-y',
        createdAt: now,
        timeSpentSec: 60,
      });
      prismaMock.studentProgress.findUnique.mockResolvedValue(null);
      prismaMock.studentProgress.upsert.mockResolvedValue({
        bestScore: 100,
        attempts: 1,
        completed: true,
        completedAt: now,
      });
      prismaMock.user.findUniqueOrThrow.mockResolvedValue(
        buildUser({ streak: 10, lastActiveAt: twoDaysAgo }),
      );

      await service.submit('user-1', {
        readingId: 'reading-1',
        answers: [
          { questionId: 'q1', selectedAnswer: 'a' },
          { questionId: 'q2', selectedAnswer: 'b' },
        ],
      });

      const updateCall = prismaMock.user.update.mock.calls[0][0];
      expect(updateCall.data.streak).toBe(1); // reset — not 11
    });
  });
});
