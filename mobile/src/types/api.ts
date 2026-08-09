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
  options: QuestionOption[] | string[];
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
