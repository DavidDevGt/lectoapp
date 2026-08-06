import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { StatsService } from '../../../src/modules/stats/stats.service';
import { DashboardQuery } from '../../../src/modules/stats/stats.validator';

function emptyAggregate() {
  return { _count: { _all: 0 }, _avg: { percentage: null } };
}

const DEFAULT_QUERY: DashboardQuery = { topLimit: 5, activeWithinDays: 7 };

describe('StatsService', () => {
  let service: StatsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      reading: { count: vi.fn(), groupBy: vi.fn(), findMany: vi.fn() },
      question: { count: vi.fn(), groupBy: vi.fn() },
      user: { count: vi.fn(), groupBy: vi.fn() },
      quizAttempt: { aggregate: vi.fn(), count: vi.fn() },
      studentProgress: { groupBy: vi.fn() },
    };

    // Defaults: base de datos vacía — cada test sobreescribe lo que necesite.
    prismaMock.reading.count.mockResolvedValue(0);
    prismaMock.reading.groupBy.mockResolvedValue([]);
    prismaMock.reading.findMany.mockResolvedValue([]);
    prismaMock.question.count.mockResolvedValue(0);
    prismaMock.question.groupBy.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(0);
    prismaMock.user.groupBy.mockResolvedValue([]);
    prismaMock.quizAttempt.aggregate.mockResolvedValue(emptyAggregate());
    prismaMock.quizAttempt.count.mockResolvedValue(0);
    prismaMock.studentProgress.groupBy.mockResolvedValue([]);

    service = new StatsService(prismaMock);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('with an empty database', () => {
    it('should return every metric at 0, all enum keys present, topReadings as [], and never throw', async () => {
      const result = await service.getDashboard(DEFAULT_QUERY);

      expect(result.readings).toEqual({
        total: 0,
        byStatus: { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 },
      });
      expect(result.questions).toEqual({
        total: 0,
        byStatus: { DRAFT: 0, APPROVED: 0 },
      });
      expect(result.students).toEqual({
        total: 0,
        active: 0,
        activeWithinDays: 7,
        byProgressionLevel: { BEGINNER: 0, INTERMEDIATE: 0, ADVANCED: 0, EXPERT: 0, SUPREME: 0 },
      });
      expect(result.quizAttempts).toEqual({
        total: 0,
        passed: 0,
        passRatePercentage: 0,
        averageScorePercentage: 0,
      });
      expect(result.topReadings).toEqual([]);
    });

    it('should default activeWithinDays to 7 in the response when no query params are sent', async () => {
      const result = await service.getDashboard(DEFAULT_QUERY);

      expect(result.students.activeWithinDays).toBe(7);
    });
  });

  describe('enum hydration', () => {
    it('should fill DRAFT and ARCHIVED with 0 when groupBy only returns PUBLISHED', async () => {
      prismaMock.reading.groupBy.mockResolvedValue([{ status: 'PUBLISHED', _count: { _all: 8 } }]);

      const result = await service.getDashboard(DEFAULT_QUERY);

      expect(result.readings.byStatus).toEqual({ DRAFT: 0, PUBLISHED: 8, ARCHIVED: 0 });
    });

    it('should hydrate all 5 progression levels even when groupBy returns a subset', async () => {
      prismaMock.user.groupBy.mockResolvedValue([{ currentLevel: 'EXPERT', _count: { _all: 2 } }]);

      const result = await service.getDashboard(DEFAULT_QUERY);

      expect(result.students.byProgressionLevel).toEqual({
        BEGINNER: 0,
        INTERMEDIATE: 0,
        ADVANCED: 0,
        EXPERT: 2,
        SUPREME: 0,
      });
    });

    it('should hydrate all 2 question statuses even when groupBy returns a subset', async () => {
      prismaMock.question.groupBy.mockResolvedValue([{ status: 'DRAFT', _count: { _all: 10 } }]);

      const result = await service.getDashboard(DEFAULT_QUERY);

      expect(result.questions.byStatus).toEqual({ DRAFT: 10, APPROVED: 0 });
    });
  });

  describe('quizAttempts aggregation', () => {
    it('should return averageScorePercentage 0 when _avg.percentage is null', async () => {
      prismaMock.quizAttempt.aggregate.mockResolvedValue({ _count: { _all: 5 }, _avg: { percentage: null } });
      prismaMock.quizAttempt.count.mockResolvedValue(3);

      const result = await service.getDashboard(DEFAULT_QUERY);

      expect(result.quizAttempts.averageScorePercentage).toBe(0);
    });

    it('should return passRatePercentage 0 (not NaN) when total is 0 and passed is 0', async () => {
      prismaMock.quizAttempt.aggregate.mockResolvedValue(emptyAggregate());
      prismaMock.quizAttempt.count.mockResolvedValue(0);

      const result = await service.getDashboard(DEFAULT_QUERY);

      expect(result.quizAttempts.passRatePercentage).toBe(0);
      expect(Number.isNaN(result.quizAttempts.passRatePercentage)).toBe(false);
    });

    it('should compute passRatePercentage from the persisted passed count without recalculating the 70% threshold', async () => {
      prismaMock.quizAttempt.aggregate.mockResolvedValue({ _count: { _all: 130 }, _avg: { percentage: 71.4 } });
      prismaMock.quizAttempt.count.mockResolvedValue(90);

      const result = await service.getDashboard(DEFAULT_QUERY);

      expect(result.quizAttempts.total).toBe(130);
      expect(result.quizAttempts.passed).toBe(90);
      expect(result.quizAttempts.passRatePercentage).toBe(69.2);
      expect(result.quizAttempts.averageScorePercentage).toBe(71.4);
    });

    it('should NOT filter quizAttempts by reading.deletedAt (a historical attempt is a fact even for a soft-deleted reading)', async () => {
      await service.getDashboard(DEFAULT_QUERY);

      const aggregateArgs = prismaMock.quizAttempt.aggregate.mock.calls[0][0];
      const countArgs = prismaMock.quizAttempt.count.mock.calls[0][0];

      expect(aggregateArgs.where).toBeUndefined();
      expect(countArgs.where).toEqual({ passed: true });
    });
  });

  describe('soft delete invariants', () => {
    it('should query readings.total excluding soft-deleted readings', async () => {
      await service.getDashboard(DEFAULT_QUERY);

      expect(prismaMock.reading.count).toHaveBeenCalledWith({ where: { deletedAt: null } });
    });

    it('should query questions.total excluding questions whose reading is soft-deleted', async () => {
      await service.getDashboard(DEFAULT_QUERY);

      expect(prismaMock.question.count).toHaveBeenCalledWith({
        where: { reading: { deletedAt: null } },
      });
    });

    it('should exclude soft-deleted readings from topReadings via the reading relation filter', async () => {
      await service.getDashboard(DEFAULT_QUERY);

      const groupByArgs = prismaMock.studentProgress.groupBy.mock.calls[0][0];
      expect(groupByArgs.where).toMatchObject({ completed: true, reading: { deletedAt: null } });
    });

    it('should query students metrics excluding soft-deleted users and non-STUDENT roles', async () => {
      await service.getDashboard(DEFAULT_QUERY);

      expect(prismaMock.user.count).toHaveBeenNthCalledWith(1, {
        where: { role: 'STUDENT', deletedAt: null },
      });
      const groupByArgs = prismaMock.user.groupBy.mock.calls[0][0];
      expect(groupByArgs.where).toEqual({ role: 'STUDENT', deletedAt: null });
    });

    it('should never count non-STUDENT (ADMIN) roles as students', async () => {
      await service.getDashboard(DEFAULT_QUERY);

      expect(prismaMock.user.count.mock.calls[0][0].where.role).toBe('STUDENT');
      expect(prismaMock.user.count.mock.calls[1][0].where.role).toBe('STUDENT');
    });
  });

  describe('active students window', () => {
    it('should count a student active when lastActiveAt is exactly now - activeWithinDays days (inclusive gte)', async () => {
      const now = new Date('2026-08-06T12:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      await service.getDashboard({ topLimit: 5, activeWithinDays: 7 });

      const activeCallArgs = prismaMock.user.count.mock.calls[1][0];
      const expectedCutoff = new Date(now.getTime() - 7 * 86_400_000);
      expect(activeCallArgs.where.lastActiveAt.gte.getTime()).toBe(expectedCutoff.getTime());
    });

    it('should treat a null lastActiveAt as inactive by relying on gte semantics (never included via query)', async () => {
      await service.getDashboard(DEFAULT_QUERY);

      const activeCallArgs = prismaMock.user.count.mock.calls[1][0];
      expect(activeCallArgs.where.lastActiveAt).toHaveProperty('gte');
    });
  });

  describe('topReadings', () => {
    it('should return the requested number of items when topLimit=20 and there are 3 groups', async () => {
      prismaMock.studentProgress.groupBy.mockResolvedValue([
        { readingId: 'r1', _count: { _all: 18 }, _avg: { bestScore: 84.3 } },
        { readingId: 'r2', _count: { _all: 10 }, _avg: { bestScore: 60 } },
        { readingId: 'r3', _count: { _all: 5 }, _avg: { bestScore: 70 } },
      ]);
      prismaMock.reading.findMany.mockResolvedValue([
        { id: 'r1', title: 'El Popol Vuh' },
        { id: 'r2', title: 'Leyendas' },
        { id: 'r3', title: 'Cuentos' },
      ]);

      const result = await service.getDashboard({ topLimit: 20, activeWithinDays: 7 });

      expect(result.topReadings).toHaveLength(3);
    });

    it('should pass a deterministic tie-break orderBy (completions desc, readingId asc) to groupBy', async () => {
      await service.getDashboard(DEFAULT_QUERY);

      const groupByArgs = prismaMock.studentProgress.groupBy.mock.calls[0][0];
      expect(groupByArgs.orderBy).toEqual([{ _count: { readingId: 'desc' } }, { readingId: 'asc' }]);
    });

    it('should preserve the groupBy order after hydrating titles, even when findMany returns a different order', async () => {
      prismaMock.studentProgress.groupBy.mockResolvedValue([
        { readingId: 'r1', _count: { _all: 18 }, _avg: { bestScore: 84.3 } },
        { readingId: 'r2', _count: { _all: 10 }, _avg: { bestScore: 60 } },
      ]);
      // findMany intencionalmente en orden distinto al de groupBy
      prismaMock.reading.findMany.mockResolvedValue([
        { id: 'r2', title: 'Leyendas' },
        { id: 'r1', title: 'El Popol Vuh' },
      ]);

      const result = await service.getDashboard(DEFAULT_QUERY);

      expect(result.topReadings.map((r) => r.readingId)).toEqual(['r1', 'r2']);
      expect(result.topReadings[0]?.title).toBe('El Popol Vuh');
      expect(result.topReadings[1]?.title).toBe('Leyendas');
    });

    it('should only call reading.findMany once (no N+1) when there are top readings', async () => {
      prismaMock.studentProgress.groupBy.mockResolvedValue([
        { readingId: 'r1', _count: { _all: 18 }, _avg: { bestScore: 84.3 } },
      ]);
      prismaMock.reading.findMany.mockResolvedValue([{ id: 'r1', title: 'El Popol Vuh' }]);

      await service.getDashboard(DEFAULT_QUERY);

      expect(prismaMock.reading.findMany).toHaveBeenCalledTimes(1);
    });

    it('should filter studentProgress by completed:true (a false completed with a high bestScore never counts)', async () => {
      await service.getDashboard(DEFAULT_QUERY);

      const groupByArgs = prismaMock.studentProgress.groupBy.mock.calls[0][0];
      expect(groupByArgs.where.completed).toBe(true);
    });

    it('should round averageScorePercentage of a top reading to 1 decimal (66.66666 -> 66.7)', async () => {
      prismaMock.studentProgress.groupBy.mockResolvedValue([
        { readingId: 'r1', _count: { _all: 3 }, _avg: { bestScore: 66.66666 } },
      ]);
      prismaMock.reading.findMany.mockResolvedValue([{ id: 'r1', title: 'X' }]);

      const result = await service.getDashboard(DEFAULT_QUERY);

      expect(result.topReadings[0]?.averageScorePercentage).toBe(66.7);
    });

    it('should map completions from _count._all', async () => {
      prismaMock.studentProgress.groupBy.mockResolvedValue([
        { readingId: 'r1', _count: { _all: 18 }, _avg: { bestScore: 84.3 } },
      ]);
      prismaMock.reading.findMany.mockResolvedValue([{ id: 'r1', title: 'El Popol Vuh' }]);

      const result = await service.getDashboard(DEFAULT_QUERY);

      expect(result.topReadings[0]).toEqual({
        readingId: 'r1',
        title: 'El Popol Vuh',
        completions: 18,
        averageScorePercentage: 84.3,
      });
    });
  });

  describe('source code invariant', () => {
    it('should never use $queryRaw or $executeRaw', () => {
      const filePath = path.resolve(__dirname, '../../../src/modules/stats/stats.service.ts');
      const source = readFileSync(filePath, 'utf-8');

      expect(source).not.toMatch(/\$queryRaw/);
      expect(source).not.toMatch(/\$executeRaw/);
    });
  });

  // ── Hardener: mutant-killing tests ──────────────────────────────────────────

  describe('topReadings ordering', () => {
    it('should place the reading with more completions first (kills desc→asc orderBy mutant)', async () => {
      // groupBy returns r2 first (DB-side order assumed asc by readingId) but r1 has more completions.
      // The service passes orderBy desc to Prisma — here we validate the service passes the result
      // in the order Prisma returns (groupBy-ordered), and that order must be desc by completions.
      // We simulate: groupBy already returns them in desc order (as Prisma would), and the service
      // must preserve that order. A mutant flipping to asc would produce a different groupBy call.
      prismaMock.studentProgress.groupBy.mockResolvedValue([
        { readingId: 'r1', _count: { _all: 50 }, _avg: { bestScore: 90 } }, // most completions
        { readingId: 'r2', _count: { _all: 10 }, _avg: { bestScore: 70 } },
      ]);
      prismaMock.reading.findMany.mockResolvedValue([
        { id: 'r1', title: 'El Popol Vuh' },
        { id: 'r2', title: 'Leyendas' },
      ]);

      const result = await service.getDashboard(DEFAULT_QUERY);

      // Order must match what groupBy returned: r1 (50 completions) before r2 (10)
      expect(result.topReadings[0]?.readingId).toBe('r1');
      expect(result.topReadings[0]?.completions).toBe(50);
      expect(result.topReadings[1]?.readingId).toBe('r2');

      // Additionally confirm the orderBy sent to groupBy uses 'desc'
      const groupByArgs = prismaMock.studentProgress.groupBy.mock.calls[0][0];
      expect(groupByArgs.orderBy[0]).toEqual({ _count: { readingId: 'desc' } });
    });
  });
});

