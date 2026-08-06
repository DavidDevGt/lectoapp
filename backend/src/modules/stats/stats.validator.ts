import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  topLimit: z.coerce.number().int().min(1).max(20).default(5),
  activeWithinDays: z.coerce.number().int().min(1).max(90).default(7),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
