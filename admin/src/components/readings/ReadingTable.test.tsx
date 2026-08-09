import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { renderWithProviders } from '../../test/renderWithProviders';
import { readingsService } from '../../services/readings.service';
import { ApiError } from '../../services/api-client';
import { ReadingTable } from './ReadingTable';
import { ReadingListItem } from '../../types/api';

vi.mock('../../services/readings.service');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockedReadingsService = vi.mocked(readingsService, true);

const baseReading: ReadingListItem = {
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

describe('ReadingTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render a link to the questions page for the reading', () => {
    renderWithProviders(<ReadingTable readings={[baseReading]} isLoading={false} onEdit={vi.fn()} />);

    expect(screen.getByRole('link', { name: /preguntas/i })).toHaveAttribute('href', '/readings/r1/questions');
  });

  it('should render a link to the preview page for the reading', () => {
    renderWithProviders(<ReadingTable readings={[baseReading]} isLoading={false} onEdit={vi.fn()} />);

    expect(screen.getByRole('link', { name: /vista previa/i })).toHaveAttribute('href', '/readings/r1/preview');
  });

  it('should call onEdit with the reading id when clicking the edit button', async () => {
    const user = userEvent.setup({ delay: null });
    const onEdit = vi.fn();
    renderWithProviders(<ReadingTable readings={[baseReading]} isLoading={false} onEdit={onEdit} />);

    await user.click(screen.getByRole('button', { name: /editar/i }));
    expect(onEdit).toHaveBeenCalledWith('r1');
  });

  it('should show a success toast when publishing succeeds', async () => {
    const user = userEvent.setup({ delay: null });
    mockedReadingsService.publish.mockResolvedValue({ ...baseReading, status: 'PUBLISHED' } as never);

    renderWithProviders(<ReadingTable readings={[baseReading]} isLoading={false} onEdit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^publicar$/i }));

    expect(toast.success).toHaveBeenCalledWith('Lectura publicada');
  });

  it('should show the backend error toast when publishing fails', async () => {
    const user = userEvent.setup({ delay: null });
    mockedReadingsService.publish.mockRejectedValue(
      new ApiError('La lectura necesita al menos 5 preguntas aprobadas para publicarse', 400),
    );

    renderWithProviders(<ReadingTable readings={[baseReading]} isLoading={false} onEdit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^publicar$/i }));

    expect(toast.error).toHaveBeenCalledWith('La lectura necesita al menos 5 preguntas aprobadas para publicarse');
  });

  it('should show a success toast when archiving succeeds', async () => {
    const user = userEvent.setup({ delay: null });
    mockedReadingsService.archive.mockResolvedValue({ ...baseReading, status: 'ARCHIVED' } as never);

    renderWithProviders(<ReadingTable readings={[baseReading]} isLoading={false} onEdit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^archivar$/i }));

    expect(toast.success).toHaveBeenCalledWith('Lectura archivada');
  });

  it('should show a success toast when unarchiving succeeds', async () => {
    const user = userEvent.setup({ delay: null });
    mockedReadingsService.unarchive.mockResolvedValue({ ...baseReading, status: 'DRAFT' } as never);

    renderWithProviders(
      <ReadingTable readings={[{ ...baseReading, status: 'ARCHIVED' }]} isLoading={false} onEdit={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: /^desarchivar$/i }));

    expect(toast.success).toHaveBeenCalledWith('Lectura desarchivada');
  });

  it('should not render the publish button for a published reading', () => {
    renderWithProviders(
      <ReadingTable readings={[{ ...baseReading, status: 'PUBLISHED' }]} isLoading={false} onEdit={vi.fn()} />,
    );

    expect(screen.queryByRole('button', { name: /^publicar$/i })).not.toBeInTheDocument();
  });

  it('should not render the archive button for an archived reading', () => {
    renderWithProviders(
      <ReadingTable readings={[{ ...baseReading, status: 'ARCHIVED' }]} isLoading={false} onEdit={vi.fn()} />,
    );

    expect(screen.queryByRole('button', { name: /^archivar$/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^desarchivar$/i })).toBeInTheDocument();
  });
});
