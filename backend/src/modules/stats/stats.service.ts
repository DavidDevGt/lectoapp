import { PrismaClient, ProgressionLevel, QuestionStatus, ReadingStatus } from '../../generated/prisma';
import { DashboardQuery } from './stats.validator';
import { DashboardStatsDTO, TopReadingDTO } from './stats.types';

const READING_STATUSES: ReadingStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
const QUESTION_STATUSES: QuestionStatus[] = ['DRAFT', 'APPROVED'];
const PROGRESSION_LEVELS: ProgressionLevel[] = [
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
  'EXPERT',
  'SUPREME',
];

const MS_PER_DAY = 86_400_000;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Convierte el resultado parcial de un `groupBy` en un Record con TODAS las
 * claves del enum presentes (0 para las que el groupBy no devolvió).
 */
function hydrateEnumCounts<K extends string, Row>(
  keys: K[],
  rows: Row[],
  getKey: (row: Row) => K,
  getCount: (row: Row) => number,
): Record<K, number> {
  const counts = new Map<K, number>(rows.map((row) => [getKey(row), getCount(row)]));
  return Object.fromEntries(keys.map((key) => [key, counts.get(key) ?? 0])) as Record<K, number>;
}

export class StatsService {
  constructor(private readonly prisma: PrismaClient) {}

  async getDashboard(query: DashboardQuery): Promise<DashboardStatsDTO> {
    const activeCutoff = new Date(Date.now() - query.activeWithinDays * MS_PER_DAY);

    const [
      readingsTotal,
      readingsByStatusRaw,
      questionsTotal,
      questionsByStatusRaw,
      studentsTotal,
      studentsActive,
      studentsByLevelRaw,
      quizAggregate,
      quizPassedCount,
      topReadingsRaw,
    ] = await Promise.all([
      this.prisma.reading.count({ where: { deletedAt: null } }),
      this.prisma.reading.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.question.count({ where: { reading: { deletedAt: null } } }),
      this.prisma.question.groupBy({
        by: ['status'],
        where: { reading: { deletedAt: null } },
        _count: { _all: true },
      }),
      this.prisma.user.count({ where: { role: 'STUDENT', deletedAt: null } }),
      this.prisma.user.count({
        where: { role: 'STUDENT', deletedAt: null, lastActiveAt: { gte: activeCutoff } },
      }),
      this.prisma.user.groupBy({
        by: ['currentLevel'],
        where: { role: 'STUDENT', deletedAt: null },
        _count: { _all: true },
      }),
      // Histórico: NO se filtra por reading.deletedAt — un intento ocurrido es un hecho.
      this.prisma.quizAttempt.aggregate({ _count: { _all: true }, _avg: { percentage: true } }),
      this.prisma.quizAttempt.count({ where: { passed: true } }),
      this.prisma.studentProgress.groupBy({
        by: ['readingId'],
        where: { completed: true, reading: { deletedAt: null } },
        _count: { _all: true },
        _avg: { bestScore: true },
        orderBy: [{ _count: { readingId: 'desc' } }, { readingId: 'asc' }],
        take: query.topLimit,
      }),
    ]);

    const topReadings = await this.hydrateTopReadings(topReadingsRaw);

    const quizTotal = quizAggregate._count._all;

    return {
      readings: {
        total: readingsTotal,
        byStatus: hydrateEnumCounts(
          READING_STATUSES,
          readingsByStatusRaw,
          (r) => r.status,
          (r) => r._count._all,
        ),
      },
      questions: {
        total: questionsTotal,
        byStatus: hydrateEnumCounts(
          QUESTION_STATUSES,
          questionsByStatusRaw,
          (r) => r.status,
          (r) => r._count._all,
        ),
      },
      students: {
        total: studentsTotal,
        active: studentsActive,
        activeWithinDays: query.activeWithinDays,
        byProgressionLevel: hydrateEnumCounts(
          PROGRESSION_LEVELS,
          studentsByLevelRaw,
          (r) => r.currentLevel,
          (r) => r._count._all,
        ),
      },
      quizAttempts: {
        total: quizTotal,
        passed: quizPassedCount,
        passRatePercentage: quizTotal > 0 ? round1((quizPassedCount / quizTotal) * 100) : 0,
        averageScorePercentage: round1(quizAggregate._avg.percentage ?? 0),
      },
      topReadings,
    };
  }

  private async hydrateTopReadings(
    topReadingsRaw: {
      readingId: string;
      _count: { _all: number };
      _avg: { bestScore: number | null };
    }[],
  ): Promise<TopReadingDTO[]> {
    if (topReadingsRaw.length === 0) {
      return [];
    }

    const readingIds = topReadingsRaw.map((row) => row.readingId);
    const readings = await this.prisma.reading.findMany({
      where: { id: { in: readingIds } },
      select: { id: true, title: true },
    });
    const titleById = new Map(readings.map((r) => [r.id, r.title]));

    // Conserva el orden del groupBy — findMany puede devolver otro orden.
    return topReadingsRaw.map((row) => ({
      readingId: row.readingId,
      title: titleById.get(row.readingId) ?? '',
      completions: row._count._all,
      averageScorePercentage: round1(row._avg.bestScore ?? 0),
    }));
  }
}
