import { z } from 'zod';

export const generateQuestionsSchema = z.object({
  readingId: z.string().min(1, 'El ID de la lectura es requerido'),
  count: z.number().int().min(1).max(10).default(5),
});

export type GenerateQuestionsInput = z.infer<typeof generateQuestionsSchema>;
