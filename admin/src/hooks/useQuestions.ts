import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { questionsService } from '../services/questions.service';
import { readingKeys } from './useReadings';
import { CreateQuestionPayload, QuestionStatus, UpdateQuestionPayload } from '../types/api';

export const questionKeys = {
  all: ['questions'] as const,
  byReading: (readingId: string) => [...questionKeys.all, readingId] as const,
  list: (readingId: string, status?: QuestionStatus) =>
    [...questionKeys.byReading(readingId), { status: status ?? 'ALL' }] as const,
};

export function useQuestions(readingId: string, status?: QuestionStatus) {
  return useQuery({
    queryKey: questionKeys.list(readingId, status),
    queryFn: () => questionsService.listByReading(readingId, status ? { status } : {}),
    enabled: Boolean(readingId),
  });
}

function invalidateQuestionAndReadingQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  readingId: string,
) {
  queryClient.invalidateQueries({ queryKey: questionKeys.byReading(readingId) });
  queryClient.invalidateQueries({ queryKey: readingKeys.all });
}

export function useCreateQuestion(readingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateQuestionPayload) => questionsService.create(readingId, payload),
    onSuccess: () => invalidateQuestionAndReadingQueries(queryClient, readingId),
  });
}

export function useUpdateQuestion(readingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateQuestionPayload }) =>
      questionsService.update(readingId, id, payload),
    onSuccess: () => invalidateQuestionAndReadingQueries(queryClient, readingId),
  });
}

export function useDeleteQuestion(readingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => questionsService.remove(readingId, id),
    onSuccess: () => invalidateQuestionAndReadingQueries(queryClient, readingId),
  });
}

export function useApproveQuestion(readingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => questionsService.approve(readingId, id),
    onSuccess: () => invalidateQuestionAndReadingQueries(queryClient, readingId),
  });
}
