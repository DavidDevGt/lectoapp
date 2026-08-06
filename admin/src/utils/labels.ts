import {
  ComprehensionLevel,
  ProgressionLevel,
  QuestionStatus,
  QuestionType,
  ReadingStatus,
} from '../types/api';

/**
 * Spanish labels for domain enums, centralized so every screen that
 * displays a reading/question status or level shows the same text.
 */

export const READING_STATUS_ORDER: ReadingStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

export const READING_STATUS_LABEL: Record<ReadingStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicada',
  ARCHIVED: 'Archivada',
};

export const COMPREHENSION_LEVEL_ORDER: ComprehensionLevel[] = ['LITERAL', 'INFERENTIAL', 'CRITICAL'];

export const COMPREHENSION_LEVEL_LABEL: Record<ComprehensionLevel, string> = {
  LITERAL: 'Literal',
  INFERENTIAL: 'Inferencial',
  CRITICAL: 'Crítico',
};

export const PROGRESSION_LEVEL_ORDER: ProgressionLevel[] = [
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
  'EXPERT',
  'SUPREME',
];

export const PROGRESSION_LEVEL_LABEL: Record<ProgressionLevel, string> = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
  EXPERT: 'Experto',
  SUPREME: 'Supremo',
};

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: 'Opción múltiple',
  TRUE_FALSE: 'Verdadero o falso',
};

export const QUESTION_STATUS_LABEL: Record<QuestionStatus, string> = {
  DRAFT: 'Borrador',
  APPROVED: 'Aprobada',
};
