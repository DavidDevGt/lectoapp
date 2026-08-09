export type ComprehensionLevel = 'LITERAL' | 'INFERENTIAL' | 'CRITICAL';
export type ProgressionLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | 'SUPREME';
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
export type UserRole = 'STUDENT' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  currentLevel: ProgressionLevel;
  totalPoints: number;
  streak: number;
  avatarUrl?: string;
}

export interface ReadingListItem {
  id: string;
  title: string;
  comprehensionLevel: ComprehensionLevel;
  progressionLevel: ProgressionLevel;
  estimatedTimeMin: number;
  coverImageUrl?: string | null;
  questionCount?: number;
  isCompleted?: boolean;
}

export interface Question {
  id: string;
  readingId: string;
  prompt: string;
  type: QuestionType;
  options: string[];
  explanation?: string;
  comprehensionLevel: ComprehensionLevel;
}

export interface ReadingDetail extends ReadingListItem {
  content: string;
  questions?: Question[];
}

export interface QuizAttemptResult {
  score: number; // Porcentaje (0-100)
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  pointsEarned: number;
  newTotalPoints: number;
  streak: number;
}

export interface StudentProgress {
  literalScore: number;
  inferentialScore: number;
  criticalScore: number;
  completedReadingsCount: number;
  totalReadingsCount: number;
}
