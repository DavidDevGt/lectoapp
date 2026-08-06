import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/renderWithProviders';
import { readingsService } from '../services/readings.service';
import { ReadingPreviewPage } from './ReadingPreviewPage';
import { ReadingDetail } from '../types/api';

vi.mock('../services/readings.service');

const mockedReadingsService = vi.mocked(readingsService, true);

function makeReading(overrides: Partial<ReadingDetail> = {}): ReadingDetail {
  return {
    id: 'r1',
    title: 'El Popol Vuh: Origen del Mundo',
    content: 'Párrafo 1.\n\nPárrafo 2.',
    comprehensionLevel: 'LITERAL',
    progressionLevel: 'BEGINNER',
    status: 'PUBLISHED',
    coverImageUrl: null,
    estimatedTimeMin: 8,
    order: 1,
    questions: [],
    author: { id: 'a1', name: 'Admin' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderPage() {
  return renderWithProviders(<ReadingPreviewPage />, {
    initialEntries: ['/readings/r1/preview'],
    routePath: '/readings/:readingId/preview',
  });
}

describe('ReadingPreviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show a loading state while fetching the reading', () => {
    mockedReadingsService.getById.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('should show an error state when the reading fails to load', async () => {
    mockedReadingsService.getById.mockRejectedValue(new Error('Network error'));

    renderPage();

    await waitFor(() => expect(screen.getByText(/no se pudo cargar la lectura/i)).toBeInTheDocument());
  });

  it('should render the reading title as a level-1 heading', async () => {
    mockedReadingsService.getById.mockResolvedValue(makeReading());

    renderPage();

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'El Popol Vuh: Origen del Mundo' }),
      ).toBeInTheDocument(),
    );
  });

  it('should render the cover image with an accessible "portada" name when coverImageUrl is set', async () => {
    mockedReadingsService.getById.mockResolvedValue(
      makeReading({ coverImageUrl: 'https://example.com/cover.jpg' }),
    );

    renderPage();

    await waitFor(() => expect(screen.getByRole('img', { name: /portada/i })).toBeInTheDocument());
    expect(screen.getByRole('img', { name: /portada/i })).toHaveAttribute(
      'src',
      'https://example.com/cover.jpg',
    );
  });

  it('should render a cover placeholder and no image when coverImageUrl is null', async () => {
    mockedReadingsService.getById.mockResolvedValue(makeReading({ coverImageUrl: null }));

    renderPage();

    await waitFor(() => expect(screen.getByTestId('cover-placeholder')).toBeInTheDocument());
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('should show the estimated time when estimatedTimeMin is set', async () => {
    mockedReadingsService.getById.mockResolvedValue(makeReading({ estimatedTimeMin: 8 }));

    renderPage();

    await waitFor(() => expect(screen.getByText(/8 min/)).toBeInTheDocument());
  });

  it('should not show a time line when estimatedTimeMin is null', async () => {
    mockedReadingsService.getById.mockResolvedValue(makeReading({ estimatedTimeMin: null }));

    renderPage();

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument(),
    );
    expect(screen.queryByText(/min/)).not.toBeInTheDocument();
  });

  it('should split content into one paragraph per blank-line-separated block', async () => {
    mockedReadingsService.getById.mockResolvedValue(
      makeReading({ content: 'Párrafo 1.\n\nPárrafo 2.' }),
    );

    renderPage();

    await waitFor(() =>
      expect(screen.getByTestId('mobile-frame').querySelectorAll('p')).toHaveLength(2),
    );
  });

  it('should show a "no visible para estudiantes" notice for draft readings', async () => {
    mockedReadingsService.getById.mockResolvedValue(makeReading({ status: 'DRAFT' }));

    renderPage();

    await waitFor(() => expect(screen.getByText(/no visible para estudiantes/i)).toBeInTheDocument());
  });

  it('should not show a status badge for published readings', async () => {
    mockedReadingsService.getById.mockResolvedValue(makeReading({ status: 'PUBLISHED' }));

    renderPage();

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument(),
    );
    expect(screen.queryByText(/no visible para estudiantes/i)).not.toBeInTheDocument();
  });

  it('should render the Spanish labels for comprehension and progression levels', async () => {
    mockedReadingsService.getById.mockResolvedValue(
      makeReading({ comprehensionLevel: 'LITERAL', progressionLevel: 'BEGINNER' }),
    );

    renderPage();

    await waitFor(() => expect(screen.getByText(/literal/i)).toBeInTheDocument());
    expect(screen.getByText(/principiante/i)).toBeInTheDocument();
  });

  it('should call readingsService.getById with the readingId from the route', async () => {
    mockedReadingsService.getById.mockResolvedValue(makeReading());

    renderPage();

    await waitFor(() => expect(mockedReadingsService.getById).toHaveBeenCalledWith('r1'));
  });
});
