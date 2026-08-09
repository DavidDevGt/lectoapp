import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { readingsService, ReadingsQuery } from '../services/readings.service';
import { CreateReadingPayload, UpdateReadingPayload } from '../types/api';

export const readingKeys = {
  all: ['readings'] as const,
  lists: () => [...readingKeys.all, 'list'] as const,
  list: (q: ReadingsQuery) => [...readingKeys.lists(), q] as const,
  details: () => [...readingKeys.all, 'detail'] as const,
  detail: (id: string) => [...readingKeys.details(), id] as const,
};

export function useReadings(query: ReadingsQuery) {
  return useQuery({
    queryKey: readingKeys.list(query),
    queryFn: () => readingsService.list(query),
    placeholderData: (previous) => previous,
  });
}

export function useReading(id: string | undefined) {
  return useQuery({
    queryKey: readingKeys.detail(id ?? ''),
    queryFn: () => readingsService.getById(id as string),
    enabled: Boolean(id),
  });
}

function invalidateReadingQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: readingKeys.all });
}

export function useCreateReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReadingPayload) => readingsService.create(payload),
    onSuccess: () => invalidateReadingQueries(queryClient),
  });
}

export function useUpdateReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateReadingPayload }) =>
      readingsService.update(id, payload),
    onSuccess: () => invalidateReadingQueries(queryClient),
  });
}

export function usePublishReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => readingsService.publish(id),
    onSuccess: () => invalidateReadingQueries(queryClient),
  });
}

export function useArchiveReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => readingsService.archive(id),
    onSuccess: () => invalidateReadingQueries(queryClient),
  });
}

export function useUnarchiveReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => readingsService.unarchive(id),
    onSuccess: () => invalidateReadingQueries(queryClient),
  });
}
