import { describe, it, expect } from 'vitest';
import {
  READING_STATUS_LABEL,
  READING_STATUS_ORDER,
  COMPREHENSION_LEVEL_LABEL,
  COMPREHENSION_LEVEL_ORDER,
  PROGRESSION_LEVEL_LABEL,
  PROGRESSION_LEVEL_ORDER,
  QUESTION_TYPE_LABEL,
  QUESTION_STATUS_LABEL,
} from './labels';

describe('labels', () => {
  describe('READING_STATUS_LABEL', () => {
    it('debería cubrir todas las claves del ORDER array', () => {
      const labelKeys = Object.keys(READING_STATUS_LABEL);
      expect(labelKeys).toEqual(expect.arrayContaining(READING_STATUS_ORDER));
      expect(READING_STATUS_ORDER).toHaveLength(labelKeys.length);
    });

    it('debería incluir DRAFT, PUBLISHED y ARCHIVED', () => {
      expect(READING_STATUS_LABEL).toHaveProperty('DRAFT');
      expect(READING_STATUS_LABEL).toHaveProperty('PUBLISHED');
      expect(READING_STATUS_LABEL).toHaveProperty('ARCHIVED');
    });

    it('debería tener labels en español', () => {
      expect(READING_STATUS_LABEL.DRAFT).toBe('Borrador');
      expect(READING_STATUS_LABEL.PUBLISHED).toBe('Publicada');
      expect(READING_STATUS_LABEL.ARCHIVED).toBe('Archivada');
    });
  });

  describe('COMPREHENSION_LEVEL_LABEL', () => {
    it('debería cubrir todas las claves del ORDER array', () => {
      const labelKeys = Object.keys(COMPREHENSION_LEVEL_LABEL);
      expect(labelKeys).toEqual(expect.arrayContaining(COMPREHENSION_LEVEL_ORDER));
      expect(COMPREHENSION_LEVEL_ORDER).toHaveLength(labelKeys.length);
    });

    it('debería tener los 3 niveles de comprensión', () => {
      expect(COMPREHENSION_LEVEL_LABEL).toHaveProperty('LITERAL');
      expect(COMPREHENSION_LEVEL_LABEL).toHaveProperty('INFERENTIAL');
      expect(COMPREHENSION_LEVEL_LABEL).toHaveProperty('CRITICAL');
    });
  });

  describe('PROGRESSION_LEVEL_LABEL', () => {
    it('debería cubrir todas las claves del ORDER array', () => {
      const labelKeys = Object.keys(PROGRESSION_LEVEL_LABEL);
      expect(labelKeys).toEqual(expect.arrayContaining(PROGRESSION_LEVEL_ORDER));
      expect(PROGRESSION_LEVEL_ORDER).toHaveLength(labelKeys.length);
    });

    it('debería tener los 5 niveles de progresión', () => {
      expect(Object.keys(PROGRESSION_LEVEL_LABEL)).toHaveLength(5);
    });

    it('debería tener el orden correcto: Principiante → Supremo', () => {
      expect(PROGRESSION_LEVEL_ORDER[0]).toBe('BEGINNER');
      expect(PROGRESSION_LEVEL_ORDER[PROGRESSION_LEVEL_ORDER.length - 1]).toBe('SUPREME');
    });
  });

  describe('QUESTION_TYPE_LABEL', () => {
    it('debería tener los 2 tipos de pregunta', () => {
      expect(QUESTION_TYPE_LABEL).toHaveProperty('MULTIPLE_CHOICE');
      expect(QUESTION_TYPE_LABEL).toHaveProperty('TRUE_FALSE');
    });
  });

  describe('QUESTION_STATUS_LABEL', () => {
    it('debería tener DRAFT y APPROVED', () => {
      expect(QUESTION_STATUS_LABEL).toHaveProperty('DRAFT');
      expect(QUESTION_STATUS_LABEL).toHaveProperty('APPROVED');
    });
  });
});
