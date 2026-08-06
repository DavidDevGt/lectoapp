import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { createTestQueryClient } from '../test/renderWithProviders';
import { readingsService } from '../services/readings.service';
import { readingKeys, useUpdateReading } from './useReadings';
import { ReadingDetail } from '../types/api';

vi.mock('../services/readings.service');

const mockedReadingsService = vi.mocked(readingsService, true);

describe('readingKeys', () => {
  it('should build hierarchical keys for lists and details', () => {
    expect(readingKeys.all).toEqual(['readings']);
    expect(readingKeys.lists()).toEqual(['readings', 'list']);
    expect(readingKeys.list({ page: 1 })).toEqual(['readings', 'list', { page: 1 }]);
    expect(readingKeys.details()).toEqual(['readings', 'detail']);
    expect(readingKeys.detail('r1')).toEqual(['readings', 'detail', 'r1']);
  });
});

describe('useUpdateReading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call readingsService.update with id and payload when mutating', async () => {
    const detail = { id: 'r1', title: 'Nuevo título' } as ReadingDetail;
    mockedReadingsService.update.mockResolvedValue(detail);

    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateReading(), { wrapper });

    result.current.mutate({ id: 'r1', payload: { title: 'Nuevo título' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedReadingsService.update).toHaveBeenCalledWith('r1', { title: 'Nuevo título' });
  });

  it('should invalidate readingKeys.all when the mutation succeeds', async () => {
    const detail = { id: 'r1', title: 'Nuevo título' } as ReadingDetail;
    mockedReadingsService.update.mockResolvedValue(detail);

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateReading(), { wrapper });

    result.current.mutate({ id: 'r1', payload: { title: 'Nuevo título' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: readingKeys.all });
  });
});
