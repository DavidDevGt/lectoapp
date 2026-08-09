import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/renderWithProviders';
import { readingsService } from '../services/readings.service';
import { ReadingsPage } from './ReadingsPage';
import { ReadingListItem } from '../types/api';

vi.mock('../services/readings.service');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockedReadingsService = vi.mocked(readingsService, true);

const listItem: ReadingListItem = {
  id: 'r1',
  title: 'El Popol Vuh',
  comprehensionLevel: 'LITERAL',
  progressionLevel: 'BEGINNER',
  status: 'DRAFT',
  coverImageUrl: null,
  estimatedTimeMin: 8,
  questionsCount: 3,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('ReadingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedReadingsService.list.mockResolvedValue({ items: [listItem], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
  });

  it('should open the create modal when clicking "Nueva lectura"', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<ReadingsPage />);

    await user.click(screen.getByRole('button', { name: /nueva lectura/i }));

    expect(screen.getByRole('heading', { name: /nueva lectura/i })).toBeInTheDocument();
  });

  it('should open the edit modal with the reading detail when clicking editar', async () => {
    const user = userEvent.setup({ delay: null });
    mockedReadingsService.getById.mockResolvedValue({
      id: 'r1',
      title: 'El Popol Vuh',
      content: 'x'.repeat(60),
      comprehensionLevel: 'LITERAL',
      progressionLevel: 'BEGINNER',
      status: 'DRAFT',
      coverImageUrl: null,
      estimatedTimeMin: 8,
      order: 1,
      questions: [],
      author: { id: 'a1', name: 'Admin' },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    renderWithProviders(<ReadingsPage />);

    await waitFor(() => expect(screen.getByText('El Popol Vuh')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /editar/i }));

    expect(screen.getByRole('heading', { name: /editar lectura/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/título/i)).toHaveValue('El Popol Vuh'));
  });
});
