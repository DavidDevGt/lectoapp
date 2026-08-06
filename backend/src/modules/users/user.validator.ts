import { z } from 'zod';

export const updateMeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  gradeLevel: z.string().max(50).optional(),
  avatarUrl: z.string().url().optional(),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['STUDENT', 'ADMIN']).optional(),
  search: z.string().optional(),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
