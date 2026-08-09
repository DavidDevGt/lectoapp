import {
  Question,
  ReadingDetail,
  ReadingListItem,
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
