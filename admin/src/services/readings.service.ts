import { apiRequest, apiRequestPaginated } from './api-client';
import { CreateReadingPayload, ReadingDetail, ReadingListItem } from '../types/api';

export interface ReadingsQuery {
  page?: number;
  limit?: number;
  comprehensionLevel?: string;
  progressionLevel?: string;
  status?: string;
  search?: string;
}

export const readingsService = {
  list: (query: ReadingsQuery = {}) =>
    apiRequestPaginated<ReadingListItem>('/readings', { query: { ...query } }),

  getById: (id: string) => apiRequest<ReadingDetail>(`/readings/${id}`),

  create: (payload: CreateReadingPayload) =>
    apiRequest<ReadingDetail>('/readings', { method: 'POST', body: payload }),

  update: (id: string, payload: Partial<CreateReadingPayload>) =>
    apiRequest<ReadingDetail>(`/readings/${id}`, { method: 'PUT', body: payload }),

  publish: (id: string) => apiRequest<ReadingDetail>(`/readings/${id}/publish`, { method: 'PATCH' }),

  archive: (id: string) => apiRequest<ReadingDetail>(`/readings/${id}/archive`, { method: 'PATCH' }),

  remove: (id: string) => apiRequest<null>(`/readings/${id}`, { method: 'DELETE' }),
};
