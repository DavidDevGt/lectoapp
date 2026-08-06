import { z } from 'zod';

const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

type QuestionOption = z.infer<typeof optionSchema>;
type QuestionTypeValue = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | undefined;

/**
 * Reglas cruzadas compartidas entre create y update: cantidad de opciones
 * según el tipo de pregunta, y que correctAnswer referencie un id existente.
 * En update, el caller solo la invoca cuando `options` viene presente en el
 * payload — `correctAnswer` puede venir undefined y ese caso se omite aquí.
 */
function validateOptionsConsistency(
  ctx: z.RefinementCtx,
  type: QuestionTypeValue,
  options: QuestionOption[],
  correctAnswer: string | undefined,
): void {
  if (type === 'MULTIPLE_CHOICE' && options.length !== 4) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['options'],
      message: 'Las preguntas de opción múltiple deben tener exactamente 4 opciones',
    });
  }

  if (type === 'TRUE_FALSE') {
    const ids = options.map((o) => o.id).sort();
    if (ids.length !== 2 || ids[0] !== 'false' || ids[1] !== 'true') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Las preguntas de verdadero/falso deben tener opciones con id "true" y "false"',
      });
    }
  }

  if (correctAnswer && !options.some((o) => o.id === correctAnswer)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['correctAnswer'],
      message: 'correctAnswer debe coincidir con el id de una de las opciones',
    });
  }
}

export const createQuestionSchema = z
  .object({
    statement: z.string().min(5, 'El enunciado debe tener al menos 5 caracteres'),
    type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE']).default('MULTIPLE_CHOICE'),
    options: z.array(optionSchema).min(2),
    correctAnswer: z.string().min(1),
    explanation: z.string().optional(),
    order: z.coerce.number().int().min(0).optional(),
  });

export const updateQuestionSchema = z
  .object({
    statement: z.string().min(5).optional(),
    type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE']).optional(),
    options: z.array(optionSchema).min(2).optional(),
    correctAnswer: z.string().min(1).optional(),
    explanation: z.string().optional(),
    order: z.coerce.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    // En un update los campos son opcionales — las reglas cruzadas solo se
    // evalúan cuando los campos relevantes vienen presentes en el payload.
    if (data.options) {
      validateOptionsConsistency(ctx, data.type, data.options, data.correctAnswer);
    }
  });

export const questionQuerySchema = z.object({
  status: z.enum(['DRAFT', 'APPROVED']).optional(),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type QuestionQuery = z.infer<typeof questionQuerySchema>;
