import { z } from 'zod';

export const uploadMediaSchema = z.object({
  type: z.enum(['reading-cover', 'avatar']),
});

export type UploadMediaInput = z.infer<typeof uploadMediaSchema>;
