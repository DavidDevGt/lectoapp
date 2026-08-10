import {
  OverallProgress,
  Question,
  ReadingDetail,
  ReadingListItem,
  SubmitProgressResult,
  User,
} from '../types/api';

export function buildAuthUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@estudiante.edu.gt',
    role: 'STUDENT',
    currentLevel: 'BEGINNER',
    totalPoints: 350,
    streak: 4,
    ...overrides,
  };
}

export function buildReadingListItem(overrides: Partial<ReadingListItem> = {}): ReadingListItem {
  return {
    id: 'reading-1',
    title: 'El quetzal y la montaña',
    comprehensionLevel: 'LITERAL',
    progressionLevel: 'BEGINNER',
    status: 'PUBLISHED',
    coverImageUrl: null,
    estimatedTimeMin: 5,
    questionsCount: 4,
    createdAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

export function buildReadingDetail(overrides: Partial<ReadingDetail> = {}): ReadingDetail {
  return {
    id: 'reading-1',
    title: 'El quetzal y la montaña',
    content: 'Contenido de la lectura de prueba en la app móvil.',
    comprehensionLevel: 'LITERAL',
    progressionLevel: 'BEGINNER',
    status: 'PUBLISHED',
    coverImageUrl: null,
    estimatedTimeMin: 5,
    order: 1,
    author: { id: 'user-0', name: 'Giovanni Educativo' },
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    questions: [buildStudentQuestion()],
    ...overrides,
  };
}

export function buildSubmitProgressResult(
  overrides: Partial<SubmitProgressResult> = {},
): SubmitProgressResult {
  return {
    attempt: {
      id: 'attempt-1',
      score: 3,
      totalQuestions: 4,
      percentage: 75,
      passed: true,
      timeSpentSec: 120,
      results: [
        {
          questionId: 'question-1',
          selectedAnswer: 'opt1',
          correctAnswer: 'opt1',
          isCorrect: true,
          explanation: 'El quetzal es el ave nacional de Guatemala.',
        },
      ],
    },
    progress: {
      bestScore: 75,
      attempts: 1,
      completed: true,
      isNewCompletion: true,
    },
    rewards: {
      pointsEarned: 100,
      totalPoints: 450,
      levelUp: false,
      newLevel: null,
    },
    ...overrides,
  };
}

export function buildOverallProgress(overrides: Partial<OverallProgress> = {}): OverallProgress {
  const breakdown = { total: 4, completed: 2, percentage: 50 };
  return {
    overall: {
      totalReadings: 12,
      completedReadings: 6,
      overallPercentage: 50,
    },
    byComprehensionLevel: {
      LITERAL: breakdown,
      INFERENTIAL: breakdown,
      CRITICAL: breakdown,
    },
    byProgressionLevel: {
      BEGINNER: breakdown,
      INTERMEDIATE: breakdown,
      ADVANCED: breakdown,
      EXPERT: breakdown,
      SUPREME: breakdown,
    },
    currentLevel: 'INTERMEDIATE',
    streak: 4,
    totalPoints: 450,
    ...overrides,
  };
}

export function buildStudentQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'question-1',
    statement: '¿Qué animal es el símbolo nacional de Guatemala?',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'opt1', text: 'El quetzal' },
      { id: 'opt2', text: 'El jaguar' },
      { id: 'opt3', text: 'El colibrí' },
      { id: 'opt4', text: 'La guacamaya' },
    ],
    order: 1,
    ...overrides,
  };
}
