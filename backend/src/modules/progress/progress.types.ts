export interface AnswerResultDTO {
  questionId: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string | null;
}

export interface SubmitProgressResultDTO {
  attempt: {
    id: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    passed: boolean;
    timeSpentSec: number | null;
    results: AnswerResultDTO[];
  };
  progress: {
    bestScore: number;
    attempts: number;
    completed: boolean;
    isNewCompletion: boolean;
  };
  rewards: {
    pointsEarned: number;
    totalPoints: number;
    levelUp: boolean;
    newLevel: string | null;
  };
}

export interface LevelBreakdownDTO {
  total: number;
  completed: number;
  percentage: number;
}

export interface OverallProgressDTO {
  overall: {
    totalReadings: number;
    completedReadings: number;
    overallPercentage: number;
  };
  byComprehensionLevel: Record<'LITERAL' | 'INFERENTIAL' | 'CRITICAL', LevelBreakdownDTO>;
  byProgressionLevel: Record<
    'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | 'SUPREME',
    LevelBreakdownDTO
  >;
  currentLevel: string;
  streak: number;
  totalPoints: number;
}

export interface ReadingProgressDTO {
  readingId: string;
  bestScore: number;
  attempts: number;
  completed: boolean;
  completedAt: Date | null;
  history: { attemptId: string; percentage: number; passed: boolean; createdAt: Date }[];
}
