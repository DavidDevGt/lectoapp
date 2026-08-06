import { ComprehensionLevel, Prisma, PrismaClient, ProgressionLevel } from '../../generated/prisma';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { SubmitProgressInput } from './progress.validator';
import { LevelBreakdownDTO, OverallProgressDTO, ReadingProgressDTO, SubmitProgressResultDTO } from './progress.types';

const PASS_THRESHOLD_PERCENTAGE = 70;
// Puntos otorgados únicamente la primera vez que se aprueba una lectura — evita
// que reintentos ilimitados (permitidos por PRD F3) generen puntos infinitos.
const POINTS_PER_FIRST_COMPLETION = 100;

const PROGRESSION_ORDER: ProgressionLevel[] = [
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
  'EXPERT',
  'SUPREME',
];
const COMPREHENSION_LEVELS: ComprehensionLevel[] = ['LITERAL', 'INFERENTIAL', 'CRITICAL'];

export class ProgressService {
  constructor(private readonly prisma: PrismaClient) {}

  async submit(userId: string, input: SubmitProgressInput): Promise<SubmitProgressResultDTO> {
    const reading = await this.prisma.reading.findFirst({
      where: { id: input.readingId, deletedAt: null, status: 'PUBLISHED' },
    });
    if (!reading) {
      throw new NotFoundError(`Lectura con ID ${input.readingId} no encontrada`);
    }

    const questions = await this.prisma.question.findMany({
      where: { readingId: reading.id, status: 'APPROVED' },
    });

    this.assertAnswersMatchQuestions(input, questions);

    const results = questions.map((question) => {
      const answer = input.answers.find((a) => a.questionId === question.id);
      const selectedAnswer = answer?.selectedAnswer ?? '';
      const isCorrect = selectedAnswer === question.correctAnswer;
      return {
        questionId: question.id,
        selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
      };
    });

    const score = results.filter((r) => r.isCorrect).length;
    const totalQuestions = questions.length;
    const percentage = (score / totalQuestions) * 100;
    const passed = percentage >= PASS_THRESHOLD_PERCENTAGE;

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        userId,
        readingId: reading.id,
        score,
        totalQuestions,
        percentage,
        passed,
        timeSpentSec: input.timeSpentSec,
        answers: results.map(({ questionId, selectedAnswer, isCorrect }) => ({
          questionId,
          selectedAnswer,
          isCorrect,
        })),
      },
    });

    const existingProgress = await this.prisma.studentProgress.findUnique({
      where: { userId_readingId: { userId, readingId: reading.id } },
    });
    const wasCompletedBefore = existingProgress?.completed ?? false;
    const isNewCompletion = passed && !wasCompletedBefore;

    const progress = await this.prisma.studentProgress.upsert({
      where: { userId_readingId: { userId, readingId: reading.id } },
      create: {
        userId,
        readingId: reading.id,
        bestScore: percentage,
        attempts: 1,
        completed: passed,
        completedAt: passed ? attempt.createdAt : null,
      },
      update: {
        bestScore: Math.max(existingProgress?.bestScore ?? 0, percentage),
        attempts: { increment: 1 },
        completed: wasCompletedBefore || passed,
        completedAt: wasCompletedBefore ? existingProgress?.completedAt : passed ? attempt.createdAt : null,
      },
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const pointsEarned = isNewCompletion ? POINTS_PER_FIRST_COMPLETION : 0;
    const streak = this.computeStreak(user.lastActiveAt, user.streak, attempt.createdAt);

    let newLevel: ProgressionLevel | null = null;
    if (isNewCompletion && reading.progressionLevel === user.currentLevel) {
      newLevel = await this.checkLevelUp(userId, user.currentLevel);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: { increment: pointsEarned },
        streak,
        lastActiveAt: attempt.createdAt,
        currentLevel: newLevel ?? undefined,
      },
    });

    return {
      attempt: {
        id: attempt.id,
        score,
        totalQuestions,
        percentage,
        passed,
        timeSpentSec: attempt.timeSpentSec,
        results,
      },
      progress: {
        bestScore: progress.bestScore,
        attempts: progress.attempts,
        completed: progress.completed,
        isNewCompletion,
      },
      rewards: {
        pointsEarned,
        totalPoints: updatedUser.totalPoints,
        levelUp: newLevel !== null,
        newLevel,
      },
    };
  }

  async getOverallProgress(userId: string): Promise<OverallProgressDTO> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const publishedFilter: Prisma.ReadingWhereInput = { status: 'PUBLISHED', deletedAt: null };

    const [totalReadings, completedReadings] = await Promise.all([
      this.prisma.reading.count({ where: publishedFilter }),
      this.prisma.studentProgress.count({
        where: { userId, completed: true, reading: publishedFilter },
      }),
    ]);

    const byComprehensionLevelEntries = await Promise.all(
      COMPREHENSION_LEVELS.map(
        async (level) => [level, await this.countLevelBreakdown(userId, { comprehensionLevel: level })] as const,
      ),
    );
    const byProgressionLevelEntries = await Promise.all(
      PROGRESSION_ORDER.map(
        async (level) => [level, await this.countLevelBreakdown(userId, { progressionLevel: level })] as const,
      ),
    );

    return {
      overall: {
        totalReadings,
        completedReadings,
        overallPercentage: totalReadings > 0 ? (completedReadings / totalReadings) * 100 : 0,
      },
      byComprehensionLevel: Object.fromEntries(
        byComprehensionLevelEntries,
      ) as OverallProgressDTO['byComprehensionLevel'],
      byProgressionLevel: Object.fromEntries(
        byProgressionLevelEntries,
      ) as OverallProgressDTO['byProgressionLevel'],
      currentLevel: user.currentLevel,
      streak: user.streak,
      totalPoints: user.totalPoints,
    };
  }

  async getReadingProgress(userId: string, readingId: string): Promise<ReadingProgressDTO> {
    const progress = await this.prisma.studentProgress.findUnique({
      where: { userId_readingId: { userId, readingId } },
    });

    if (!progress) {
      throw new NotFoundError('Aún no hay progreso registrado para esta lectura');
    }

    const attempts = await this.prisma.quizAttempt.findMany({
      where: { userId, readingId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      readingId,
      bestScore: progress.bestScore,
      attempts: progress.attempts,
      completed: progress.completed,
      completedAt: progress.completedAt,
      history: attempts.map((a) => ({
        attemptId: a.id,
        percentage: a.percentage,
        passed: a.passed,
        createdAt: a.createdAt,
      })),
    };
  }

  private assertAnswersMatchQuestions(
    input: SubmitProgressInput,
    questions: { id: string }[],
  ): void {
    const questionIds = new Set(questions.map((q) => q.id));
    const answeredIds = new Set(input.answers.map((a) => a.questionId));

    const hasUnknownQuestion = input.answers.some((a) => !questionIds.has(a.questionId));
    const missingAnswers = questions.some((q) => !answeredIds.has(q.id));

    if (hasUnknownQuestion || missingAnswers || answeredIds.size !== questionIds.size) {
      throw new ValidationError('Las respuestas no coinciden con las preguntas aprobadas de la lectura');
    }
  }

  private async checkLevelUp(
    userId: string,
    currentLevel: ProgressionLevel,
  ): Promise<ProgressionLevel | null> {
    const currentIndex = PROGRESSION_ORDER.indexOf(currentLevel);
    if (currentIndex === PROGRESSION_ORDER.length - 1) {
      return null; // Ya está en SUPREME, no hay siguiente nivel
    }

    const levelFilter: Prisma.ReadingWhereInput = {
      status: 'PUBLISHED',
      deletedAt: null,
      progressionLevel: currentLevel,
    };

    const [totalInLevel, completedInLevel] = await Promise.all([
      this.prisma.reading.count({ where: levelFilter }),
      this.prisma.studentProgress.count({
        where: { userId, completed: true, reading: levelFilter },
      }),
    ]);

    if (totalInLevel > 0 && completedInLevel >= totalInLevel) {
      const nextLevel = PROGRESSION_ORDER[currentIndex + 1];
      return nextLevel ?? null;
    }

    return null;
  }

  private async countLevelBreakdown(
    userId: string,
    levelFilter: Pick<Prisma.ReadingWhereInput, 'comprehensionLevel' | 'progressionLevel'>,
  ): Promise<LevelBreakdownDTO> {
    const readingFilter: Prisma.ReadingWhereInput = {
      status: 'PUBLISHED',
      deletedAt: null,
      ...levelFilter,
    };

    const [total, completed] = await Promise.all([
      this.prisma.reading.count({ where: readingFilter }),
      this.prisma.studentProgress.count({ where: { userId, completed: true, reading: readingFilter } }),
    ]);

    return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 };
  }

  private computeStreak(lastActiveAt: Date | null, currentStreak: number, now: Date): number {
    if (!lastActiveAt) return 1;

    const diffDays = this.diffInCalendarDays(lastActiveAt, now);
    if (diffDays === 0) return currentStreak || 1;
    if (diffDays === 1) return currentStreak + 1;
    return 1;
  }

  private diffInCalendarDays(a: Date, b: Date): number {
    const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((utcB - utcA) / 86_400_000);
  }
}
