import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { createTestQueryClient } from '../test/renderWithProviders';
import { questionsService } from '../services/questions.service';
import { readingKeys } from './useReadings';
import {
  questionKeys,
  useApproveQuestion,
  useCreateQuestion,
  useDeleteQuestion,
  useQuestions,
  useUpdateQuestion,
} from './useQuestions';
import { AdminQuestion } from '../types/api';

vi.mock('../services/questions.service');

const mockedQuestionsService = vi.mocked(questionsService, true);

function wrapperFor(queryClient: ReturnType<typeof createTestQueryClient>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('questionKeys', () => {
  it('should build hierarchical keys including status filter', () => {
    expect(questionKeys.all).toEqual(['questions']);
    expect(questionKeys.byReading('r1')).toEqual(['questions', 'r1']);
    expect(questionKeys.list('r1')).toEqual(['questions', 'r1', { status: 'ALL' }]);
    expect(questionKeys.list('r1', 'DRAFT')).toEqual(['questions', 'r1', { status: 'DRAFT' }]);
  });
});

describe('useQuestions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call questionsService.listByReading with the status filter when provided', async () => {
    mockedQuestionsService.listByReading.mockResolvedValue([]);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useQuestions('r1', 'DRAFT'), { wrapper: wrapperFor(queryClient) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedQuestionsService.listByReading).toHaveBeenCalledWith('r1', { status: 'DRAFT' });
  });

  it('should not fetch when readingId is empty', () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useQuestions(''), { wrapper: wrapperFor(queryClient) });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedQuestionsService.listByReading).not.toHaveBeenCalled();
  });
});

describe('question mutations', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should invalidate questionKeys.byReading and readingKeys.all when creating a question', async () => {
    const created = { id: 'q1' } as AdminQuestion;
    mockedQuestionsService.create.mockResolvedValue(created);
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateQuestion('r1'), { wrapper: wrapperFor(queryClient) });
    result.current.mutate({
      statement: 'stmt',
      type: 'MULTIPLE_CHOICE',
      options: [],
      correctAnswer: 'a',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: questionKeys.byReading('r1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: readingKeys.all });
  });

  it('should call questionsService.update with readingId, id and payload', async () => {
    const updated = { id: 'q1' } as AdminQuestion;
    mockedQuestionsService.update.mockResolvedValue(updated);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useUpdateQuestion('r1'), { wrapper: wrapperFor(queryClient) });
    result.current.mutate({ id: 'q1', payload: { statement: 'nuevo' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedQuestionsService.update).toHaveBeenCalledWith('r1', 'q1', { statement: 'nuevo' });
  });

  it('should call questionsService.remove with readingId and id', async () => {
    mockedQuestionsService.remove.mockResolvedValue(null);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useDeleteQuestion('r1'), { wrapper: wrapperFor(queryClient) });
    result.current.mutate('q1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedQuestionsService.remove).toHaveBeenCalledWith('r1', 'q1');
  });

  it('should call questionsService.approve with readingId and id', async () => {
    const approved = { id: 'q1', status: 'APPROVED' } as AdminQuestion;
    mockedQuestionsService.approve.mockResolvedValue(approved);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useApproveQuestion('r1'), { wrapper: wrapperFor(queryClient) });
    result.current.mutate('q1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedQuestionsService.approve).toHaveBeenCalledWith('r1', 'q1');
  });
});
