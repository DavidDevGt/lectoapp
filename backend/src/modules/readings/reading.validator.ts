import { z } from 'zod';

export const comprehensionLevelEnum = z.enum(['LITERAL', 'INFERENTIAL', 'CRITICAL']);
export const progressionLevelEnum = z.enum([
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
  'EXPERT',
  'SUPREME',
]);
export const readingStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

export const createReadingSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(200),
  content: z.string().min(50, 'El contenido debe tener al menos 50 caracteres'),
  comprehensionLevel: comprehensionLevelEnum,
  progressionLevel: progressionLevelEnum,
  coverImageUrl: z.string().url().optional(),
  estimatedTimeMin: z.coerce.number().int().positive().optional(),
  order: z.coerce.number().int().min(0).optional(),
});

export const updateReadingSchema = createReadingSchema.partial();

export const readingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  comprehensionLevel: comprehensionLevelEnum.optional(),
  progressionLevel: progressionLevelEnum.optional(),
  status: readingStatusEnum.optional(),
  sortBy: z.enum(['createdAt', 'title', 'order']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

export type CreateReadingInput = z.infer<typeof createReadingSchema>;
export type UpdateReadingInput = z.infer<typeof updateReadingSchema>;
export type ReadingQuery = z.infer<typeof readingQuerySchema>;
