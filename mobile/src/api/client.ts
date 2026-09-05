import {
  AuthSession,
  OverallProgress,
  Paginated,
  ReadingDetail,
  ReadingListItem,
  SubmitProgressResult,
} from '../types/api';
import { request, requestEnvelope, httpSession } from './http';

/**
 * Cliente de la API de LectoApp.
 *
 * No existe modo mock ni fallback: si el servidor no responde, la llamada lanza un
 * ApiError y la pantalla debe mostrar el error con una vía de recuperación. Inventar
 * lecturas o calificaciones sería mostrarle datos falsos a un estudiante.
 */

export interface ReadingsQuery {
  comprehensionLevel?: string;
  progressionLevel?: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}

function buildReadingsPath(query: ReadingsQuery): string {
  const params = new URLSearchParams();
  if (query.comprehensionLevel && query.comprehensionLevel !== 'ALL') {
    params.set('comprehensionLevel', query.comprehensionLevel);
  }
  if (query.progressionLevel && query.progressionLevel !== 'ALL') {
    params.set('progressionLevel', query.progressionLevel);
  }
  params.set('page', String(query.page ?? 1));
  params.set('limit', String(query.limit ?? 20));
  return `/readings?${params.toString()}`;
}

export const apiClient = {
  /** Sincroniza el par de tokens que usará la capa HTTP. */
  setSession: httpSession.set,
  onSessionExpired: httpSession.onExpired,

  async login(email: string, password: string, signal?: AbortSignal): Promise<AuthSession> {
    return request<AuthSession>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
      signal,
    });
  },

  async register(
    name: string,
    email: string,
    password: string,
    gradeLevel?: string,
    signal?: AbortSignal,
  ): Promise<AuthSession> {
    return request<AuthSession>('/auth/register', {
      method: 'POST',
      body: { name, email, password, ...(gradeLevel ? { gradeLevel } : {}) },
      auth: false,
      signal,
    });
  },

  async logout(): Promise<void> {
    await request<unknown>('/auth/logout', { method: 'POST' });
  },

  async getReadings(query: ReadingsQuery = {}): Promise<Paginated<ReadingListItem>> {
    const envelope = await requestEnvelope<ReadingListItem[]>(buildReadingsPath(query), {
      signal: query.signal,
    });
    const items = envelope.data ?? [];
    return {
      items,
      meta: envelope.meta ?? {
        page: 1,
        limit: items.length,
        total: items.length,
        totalPages: 1,
      },
    };
  },

  async getReadingById(id: string, signal?: AbortSignal): Promise<ReadingDetail> {
    return request<ReadingDetail>(`/readings/${id}`, { signal });
  },

  async submitQuiz(
    readingId: string,
    answers: Record<string, string>,
    timeSpentSec?: number,
    signal?: AbortSignal,
  ): Promise<SubmitProgressResult> {
    return request<SubmitProgressResult>('/progress/submit', {
      method: 'POST',
      signal,
      body: {
        readingId,
        answers: Object.entries(answers).map(([questionId, selectedAnswer]) => ({
          questionId,
          selectedAnswer,
        })),
        ...(timeSpentSec !== undefined ? { timeSpentSec } : {}),
      },
    });
  },

  async getMyProgress(signal?: AbortSignal): Promise<OverallProgress> {
    return request<OverallProgress>('/progress/me', { signal });
  },
};
