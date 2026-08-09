import { apiRequest } from './api-client';
import { AdminQuestion } from '../types/api';

export const aiService = {
  generateQuestions: (readingId: string, count = 5) =>
    apiRequest<AdminQuestion[]>('/ai/generate', {
      method: 'POST',
      body: { readingId, count },
    }),
};
