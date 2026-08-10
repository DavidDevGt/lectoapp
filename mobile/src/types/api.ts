export type ComprehensionLevel = 'LITERAL' | 'INFERENTIAL' | 'CRITICAL';
export type ProgressionLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | 'SUPREME';
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
export type UserRole = 'STUDENT' | 'ADMIN';
export type ReadingStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  currentLevel: ProgressionLevel;
  totalPoints: number;
  streak: number;
}

/** Respuesta de POST /auth/login y POST /auth/refresh. */
export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ReadingListItem {
  id: string;
  title: string;
  comprehensionLevel: ComprehensionLevel;
  progressionLevel: ProgressionLevel;
  status: ReadingStatus;
  coverImageUrl: string | null;
  estimatedTimeMin: number;
  questionsCount: number;
  createdAt: string | Date;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  statement: string;
  type: QuestionType;
  options: QuestionOption[];
  order: number;
}

export interface ReadingDetail {
  id: string;
  title: string;
  content: string;
  comprehensionLevel: ComprehensionLevel;
  progressionLevel: ProgressionLevel;
  status: ReadingStatus;
  coverImageUrl: string | null;
  estimatedTimeMin: number;
  order: number;
  questions: Question[];
  author: { id: string; name: string };
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface AnswerResult {
  questionId: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string | null;
}

/**
 * Respuesta de POST /progress/submit — refleja exactamente SubmitProgressResultDTO
 * del backend. La calificación es 100% del servidor; la app nunca la calcula.
 */
export interface SubmitProgressResult {
  attempt: {
    id: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    passed: boolean;
    timeSpentSec: number | null;
    results: AnswerResult[];
  };
  progress: {
    bestScore: number;
    attempts: number;
    completed: boolean;
    /** false en reintentos de una lectura ya aprobada: no se vuelven a otorgar puntos. */
    isNewCompletion: boolean;
  };
  rewards: {
    pointsEarned: number;
    totalPoints: number;
    levelUp: boolean;
    newLevel: string | null;
  };
}

export interface LevelBreakdown {
  total: number;
  completed: number;
  percentage: number;
}

/** Respuesta de GET /progress/me — refleja OverallProgressDTO del backend. */
export interface OverallProgress {
  overall: {
    totalReadings: number;
    completedReadings: number;
    overallPercentage: number;
  };
  byComprehensionLevel: Record<ComprehensionLevel, LevelBreakdown>;
  byProgressionLevel: Record<ProgressionLevel, LevelBreakdown>;
  currentLevel: ProgressionLevel;
  streak: number;
  totalPoints: number;
}
