export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: ApiMeta;
}

export type UserRole = 'STUDENT' | 'ADMIN';
export type ComprehensionLevel = 'LITERAL' | 'INFERENTIAL' | 'CRITICAL';
export type ProgressionLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | 'SUPREME';
export type ReadingStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
export type QuestionStatus = 'DRAFT' | 'APPROVED';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  currentLevel: ProgressionLevel;
  totalPoints: number;
  streak: number;
}

export interface AuthResult {
  user: AuthUser;
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
  estimatedTimeMin: number | null;
  questionsCount: number;
  createdAt: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface ReadingQuestion {
  id: string;
  statement: string;
  type: QuestionType;
  options: QuestionOption[];
  order: number;
  correctAnswer?: string;
  explanation?: string | null;
  isAiGenerated?: boolean;
  status?: QuestionStatus;
}

export interface ReadingDetail {
  id: string;
  title: string;
  content: string;
  comprehensionLevel: ComprehensionLevel;
  progressionLevel: ProgressionLevel;
  status: ReadingStatus;
  coverImageUrl: string | null;
  estimatedTimeMin: number | null;
  order: number;
  questions: ReadingQuestion[];
  author: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateReadingPayload {
  title: string;
  content: string;
  comprehensionLevel: ComprehensionLevel;
  progressionLevel: ProgressionLevel;
  coverImageUrl?: string;
  estimatedTimeMin?: number;
  order?: number;
}

export type UpdateReadingPayload = Partial<CreateReadingPayload>;

export interface AdminQuestion {
  id: string;
  statement: string;
  type: QuestionType;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string | null;
  order: number;
  isAiGenerated: boolean;
  status: QuestionStatus;
}

export interface CreateQuestionPayload {
  statement: string;
  type: QuestionType;
  options: QuestionOption[];
  correctAnswer: string;
  explanation?: string;
  order?: number;
}

export type UpdateQuestionPayload = Partial<CreateQuestionPayload>;

export interface DashboardStats {
  readings: { total: number; byStatus: Record<ReadingStatus, number> };
  questions: { total: number; byStatus: Record<QuestionStatus, number> };
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
  topReadings: TopReadingStat[];
}

export interface TopReadingStat {
  readingId: string;
  title: string;
  completions: number;
  averageScorePercentage: number;
}
