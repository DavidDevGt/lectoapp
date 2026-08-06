import { apiRequest } from './api-client';
import { AdminQuestion, CreateQuestionPayload, QuestionStatus, UpdateQuestionPayload } from '../types/api';

export interface QuestionsQuery {
  status?: QuestionStatus;
}

export const questionsService = {
  listByReading: (readingId: string, query: QuestionsQuery = {}) =>
    apiRequest<AdminQuestion[]>(`/readings/${readingId}/questions`, { query: { ...query } }),

  create: (readingId: string, payload: CreateQuestionPayload) =>
    apiRequest<AdminQuestion>(`/readings/${readingId}/questions`, { method: 'POST', body: payload }),

  update: (readingId: string, id: string, payload: UpdateQuestionPayload) =>
    apiRequest<AdminQuestion>(`/readings/${readingId}/questions/${id}`, { method: 'PUT', body: payload }),

  remove: (readingId: string, id: string) =>
    apiRequest<null>(`/readings/${readingId}/questions/${id}`, { method: 'DELETE' }),

  approve: (readingId: string, id: string) =>
    apiRequest<AdminQuestion>(`/readings/${readingId}/questions/${id}/approve`, { method: 'PATCH' }),
};
