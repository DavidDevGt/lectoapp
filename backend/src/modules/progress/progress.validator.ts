import { z } from 'zod';

export const submitProgressSchema = z.object({
  readingId: z.string().min(1),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedAnswer: z.string().min(1),
      }),
    )
    .min(1, 'Debes responder al menos una pregunta'),
  timeSpentSec: z.coerce.number().int().positive().optional(),
});

export type SubmitProgressInput = z.infer<typeof submitProgressSchema>;
