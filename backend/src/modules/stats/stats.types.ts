import { ProgressionLevel, QuestionStatus, ReadingStatus } from '../../generated/prisma';

export interface DashboardStatsDTO {
  readings: {
    total: number;
    byStatus: Record<ReadingStatus, number>;
  };
  questions: {
    total: number;
    byStatus: Record<QuestionStatus, number>;
  };
  students: {
    total: number;
    active: number;
    activeWithinDays: number;
    byProgressionLevel: Record<ProgressionLevel, number>;
  };
  quizAttempts: {
    total: number;
    passed: number;
    passRatePercentage: number;
    averageScorePercentage: number;
  };
  topReadings: TopReadingDTO[];
}

export interface TopReadingDTO {
  readingId: string;
  title: string;
  completions: number;
  averageScorePercentage: number;
}
