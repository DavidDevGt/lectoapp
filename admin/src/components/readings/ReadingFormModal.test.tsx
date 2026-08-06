import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { renderWithProviders } from '../../test/renderWithProviders';
import { readingsService } from '../../services/readings.service';
import { ApiError } from '../../services/api-client';
import { ReadingFormModal } from './ReadingFormModal';
import { ReadingDetail } from '../../types/api';

vi.mock('../../services/readings.service');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockedReadingsService = vi.mocked(readingsService, true);

const detail: ReadingDetail = {
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
};

describe('ReadingFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create mode', () => {
    it('should render the create heading and not fetch the reading detail', () => {
      renderWithProviders(<ReadingFormModal mode="create" onClose={vi.fn()} />);

      expect(screen.getByRole('heading', { name: /nueva lectura/i })).toBeInTheDocument();
      expect(readingsService.getById).not.toHaveBeenCalled();
    });

    it('should create a reading and close the modal on success', async () => {
      const user = userEvent.setup();
      mockedReadingsService.create.mockResolvedValue(detail);
      const onClose = vi.fn();

      renderWithProviders(<ReadingFormModal mode="create" onClose={onClose} />);

      await user.type(screen.getByLabelText(/título/i), 'Nuevo título');
      await user.type(screen.getByLabelText(/contenido/i), 'x'.repeat(60));
      await user.click(screen.getByRole('button', { name: /crear lectura/i }));

      await waitFor(() => expect(onClose).toHaveBeenCalled());
      expect(toast.success).toHaveBeenCalledWith('Lectura creada como borrador');
    });
  });

  describe('edit mode', () => {
    it('should show a loading state and not render the form while fetching', () => {
      mockedReadingsService.getById.mockReturnValue(new Promise(() => {}));

      renderWithProviders(<ReadingFormModal mode="edit" readingId="r1" onClose={vi.fn()} />);

      expect(screen.getByText(/cargando lectura/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/título/i)).not.toBeInTheDocument();
    });

    it('should populate the form with the loaded reading, treating null as empty', async () => {
      mockedReadingsService.getById.mockResolvedValue(detail);

      renderWithProviders(<ReadingFormModal mode="edit" readingId="r1" onClose={vi.fn()} />);

      await waitFor(() => expect(screen.getByLabelText(/título/i)).toHaveValue('El Popol Vuh'));
      expect(screen.getByLabelText(/tiempo estimado/i)).toHaveValue(8);
      expect(screen.getByLabelText(/imagen de portada/i)).toHaveValue('');
    });

    it('should show an error state with a close button when the detail fails to load', async () => {
      mockedReadingsService.getById.mockRejectedValue(new ApiError('No encontrada', 404));

      renderWithProviders(<ReadingFormModal mode="edit" readingId="r1" onClose={vi.fn()} />);

      await waitFor(() => expect(screen.getByText(/no se pudo cargar la lectura/i)).toBeInTheDocument());
      expect(screen.getByRole('button', { name: /cerrar/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/título/i)).not.toBeInTheDocument();
    });

    it('should call readingsService.update and close on success', async () => {
      const user = userEvent.setup();
      mockedReadingsService.getById.mockResolvedValue(detail);
      mockedReadingsService.update.mockResolvedValue({ ...detail, title: 'Nuevo título' });
      const onClose = vi.fn();

      renderWithProviders(<ReadingFormModal mode="edit" readingId="r1" onClose={onClose} />);

      await waitFor(() => expect(screen.getByLabelText(/título/i)).toHaveValue('El Popol Vuh'));

      await user.clear(screen.getByLabelText(/título/i));
      await user.type(screen.getByLabelText(/título/i), 'Nuevo título');
      await user.click(screen.getByRole('button', { name: /guardar/i }));

      await waitFor(() =>
        expect(mockedReadingsService.update).toHaveBeenCalledWith(
          'r1',
          expect.objectContaining({ title: 'Nuevo título' }),
        ),
      );
      expect(toast.success).toHaveBeenCalledWith('Lectura actualizada');
      expect(onClose).toHaveBeenCalled();
    });

    it('should show the backend error and keep the modal open when update fails', async () => {
      const user = userEvent.setup();
      mockedReadingsService.getById.mockResolvedValue(detail);
      mockedReadingsService.update.mockRejectedValue(new ApiError('El título ya existe', 400));
      const onClose = vi.fn();

      renderWithProviders(<ReadingFormModal mode="edit" readingId="r1" onClose={onClose} />);

      await waitFor(() => expect(screen.getByLabelText(/título/i)).toHaveValue('El Popol Vuh'));

      await user.click(screen.getByRole('button', { name: /guardar/i }));

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('El título ya existe'));
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByLabelText(/título/i)).toHaveValue('El Popol Vuh');
    });
  });
});
