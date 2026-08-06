import { describe, it, expect } from 'vitest';
import { updateQuestionSchema } from '../../../src/modules/questions/question.validator';

describe('updateQuestionSchema', () => {
  it('should allow a partial update with only statement', () => {
    const result = updateQuestionSchema.safeParse({ statement: 'Nuevo enunciado válido' });

    expect(result.success).toBe(true);
  });

  it('should reject when options are provided but correctAnswer does not match any option id', () => {
    const result = updateQuestionSchema.safeParse({
      options: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
      ],
      correctAnswer: 'z',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join('.') === 'correctAnswer');
      expect(issue?.message).toBe('correctAnswer debe coincidir con el id de una de las opciones');
    }
  });

  it('should accept when options are provided and correctAnswer matches one of them', () => {
    const result = updateQuestionSchema.safeParse({
      options: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
      ],
      correctAnswer: 'a',
    });

    expect(result.success).toBe(true);
  });

  it('should reject when type is MULTIPLE_CHOICE and options provided do not have exactly 4 options', () => {
    const result = updateQuestionSchema.safeParse({
      type: 'MULTIPLE_CHOICE',
      options: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
        { id: 'c', text: 'C' },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join('.') === 'options');
      expect(issue?.message).toBe(
        'Las preguntas de opción múltiple deben tener exactamente 4 opciones',
      );
    }
  });

  it('should accept when type is MULTIPLE_CHOICE and options has exactly 4 options', () => {
    const result = updateQuestionSchema.safeParse({
      type: 'MULTIPLE_CHOICE',
      options: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
        { id: 'c', text: 'C' },
        { id: 'd', text: 'D' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('should reject when type is TRUE_FALSE and options do not have ids true/false', () => {
    const result = updateQuestionSchema.safeParse({
      type: 'TRUE_FALSE',
      options: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join('.') === 'options');
      expect(issue?.message).toBe(
        'Las preguntas de verdadero/falso deben tener opciones con id "true" y "false"',
      );
    }
  });

  it('should not evaluate the cross-field rule for options/type when options is not provided', () => {
    const result = updateQuestionSchema.safeParse({ type: 'MULTIPLE_CHOICE' });

    expect(result.success).toBe(true);
  });

  it('should not evaluate the correctAnswer cross-field rule when correctAnswer is not provided', () => {
    const result = updateQuestionSchema.safeParse({
      options: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('should not evaluate the cardinality rule for options when type is not provided', () => {
    // Sin `type` en el payload no podemos saber si debe validarse como
    // MULTIPLE_CHOICE (4 opciones) o TRUE_FALSE (true/false), así que la regla
    // de cardinalidad no se evalúa — solo se exige la coherencia con correctAnswer.
    const result = updateQuestionSchema.safeParse({
      options: [
        { id: 'a', text: 'A' },
        { id: 'b', text: 'B' },
        { id: 'c', text: 'C' },
      ],
    });

    expect(result.success).toBe(true);
  });
});
