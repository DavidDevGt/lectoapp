import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { renderWithProviders } from '../test/renderWithProviders';
import { readingsService } from '../services/readings.service';
import { questionsService } from '../services/questions.service';
import { ApiError } from '../services/api-client';
import { QuestionsPage } from './QuestionsPage';
import { AdminQuestion, ReadingDetail } from '../types/api';

vi.mock('../services/readings.service');
vi.mock('../services/questions.service');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockedReadingsService = vi.mocked(readingsService, true);
const mockedQuestionsService = vi.mocked(questionsService, true);

const reading: ReadingDetail = {
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

function makeQuestion(overrides: Partial<AdminQuestion>): AdminQuestion {
  return {
    id: 'q1',
    statement: '¿Cuál es la capital de Guatemala?',
    type: 'MULTIPLE_CHOICE',
    options: [
      { id: 'a', text: 'Ciudad de Guatemala' },
      { id: 'b', text: 'Antigua' },
      { id: 'c', text: 'Quetzaltenango' },
      { id: 'd', text: 'Escuintla' },
    ],
    correctAnswer: 'a',
    explanation: null,
    order: 1,
    isAiGenerated: false,
    status: 'DRAFT',
    ...overrides,
  };
}

function renderPage() {
  return renderWithProviders(<QuestionsPage />, {
    initialEntries: ['/readings/r1/questions'],
    routePath: '/readings/:readingId/questions',
  });
}

describe('QuestionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedReadingsService.getById.mockResolvedValue(reading);
  });

  it('should show the reading title and a back link to readings', async () => {
    mockedQuestionsService.listByReading.mockResolvedValue([]);
    renderPage();

    await waitFor(() => expect(screen.getByRole('heading', { name: /el popol vuh/i })).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /volver a lecturas/i })).toHaveAttribute('href', '/readings');
  });

  it('should show an empty state with a CTA when there are no questions', async () => {
    mockedQuestionsService.listByReading.mockResolvedValue([]);
    renderPage();

    await waitFor(() =>
      expect(screen.getByText(/esta lectura no tiene preguntas todavía/i)).toBeInTheDocument(),
    );
  });

  it('should render one article per question', async () => {
    mockedQuestionsService.listByReading.mockResolvedValue([
      makeQuestion({ id: 'q1', order: 1 }),
      makeQuestion({ id: 'q2', order: 2 }),
    ]);
    renderPage();

    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2));
  });

  it('should disable publish and show missing count with 3 approved and 4 draft', async () => {
    const questions = [
      ...Array.from({ length: 3 }, (_, i) => makeQuestion({ id: `a${i}`, status: 'APPROVED', order: i + 1 })),
      ...Array.from({ length: 4 }, (_, i) => makeQuestion({ id: `d${i}`, status: 'DRAFT', order: i + 4 })),
    ];
    mockedQuestionsService.listByReading.mockResolvedValue(questions);
    renderPage();

    await waitFor(() =>
      expect(screen.getByText(/faltan 2 preguntas aprobadas para publicar/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /publicar lectura/i })).toBeDisabled();
  });

  it('should enable publish with 5 or more approved questions', async () => {
    const questions = Array.from({ length: 5 }, (_, i) => makeQuestion({ id: `a${i}`, status: 'APPROVED', order: i + 1 }));
    mockedQuestionsService.listByReading.mockResolvedValue(questions);
    renderPage();

    await waitFor(() => expect(screen.getByRole('button', { name: /publicar lectura/i })).toBeEnabled());
  });

  it('should call questionsService.listByReading with the status filter when selecting "Pendientes de revisión"', async () => {
    const user = userEvent.setup();
    mockedQuestionsService.listByReading.mockResolvedValue([]);
    renderPage();

    await waitFor(() => expect(mockedQuestionsService.listByReading).toHaveBeenCalledWith('r1', {}));

    await user.click(screen.getByRole('button', { name: /pendientes de revisión/i }));

    await waitFor(() =>
      expect(mockedQuestionsService.listByReading).toHaveBeenCalledWith('r1', { status: 'DRAFT' }),
    );
  });

  it('should show a "no hay preguntas pendientes" message when the DRAFT filter has no results', async () => {
    const user = userEvent.setup();
    mockedQuestionsService.listByReading.mockResolvedValue([]);
    renderPage();

    await waitFor(() => expect(mockedQuestionsService.listByReading).toHaveBeenCalled());
    await user.click(screen.getByRole('button', { name: /pendientes de revisión/i }));

    await waitFor(() =>
      expect(screen.getByText(/no hay preguntas pendientes de revisión/i)).toBeInTheDocument(),
    );
  });

  it('should call questionsService.approve and show a success toast when clicking Aprobar', async () => {
    const user = userEvent.setup();
    mockedQuestionsService.listByReading.mockResolvedValue([makeQuestion({ id: 'q7', status: 'DRAFT' })]);
    mockedQuestionsService.approve.mockResolvedValue(makeQuestion({ id: 'q7', status: 'APPROVED' }));
    renderPage();

    await waitFor(() => expect(screen.getByRole('button', { name: /aprobar/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /aprobar/i }));

    await waitFor(() => expect(mockedQuestionsService.approve).toHaveBeenCalledWith('r1', 'q7'));
    expect(toast.success).toHaveBeenCalledWith('Pregunta aprobada');
  });

  it('should show the confirm dialog before deleting and not call remove until confirmed', async () => {
    const user = userEvent.setup();
    mockedQuestionsService.listByReading.mockResolvedValue([makeQuestion({ id: 'q1' })]);
    mockedQuestionsService.remove.mockResolvedValue(null);
    renderPage();

    await waitFor(() => expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /eliminar/i }));

    const dialog = screen.getByRole('dialog', { name: /eliminar pregunta/i });
    expect(dialog).toBeInTheDocument();
    expect(questionsService.remove).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: /^eliminar$/i }));

    await waitFor(() => expect(mockedQuestionsService.remove).toHaveBeenCalledWith('r1', 'q1'));
  });

  it('should show a network error message with a retry button', async () => {
    mockedQuestionsService.listByReading.mockRejectedValue(new Error('Network Error'));
    renderPage();

    await waitFor(() =>
      expect(screen.getByText(/no se pudieron cargar las preguntas/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('should show a warning when two questions share the same order', async () => {
    mockedQuestionsService.listByReading.mockResolvedValue([
      makeQuestion({ id: 'q1', order: 1 }),
      makeQuestion({ id: 'q2', order: 1 }),
    ]);
    renderPage();

    await waitFor(() =>
      expect(screen.getByText(/hay preguntas con el mismo orden/i)).toBeInTheDocument(),
    );
  });

  it('should show the backend error via toast when publishing fails with a race condition', async () => {
    const user = userEvent.setup();
    const questions = Array.from({ length: 5 }, (_, i) => makeQuestion({ id: `a${i}`, status: 'APPROVED', order: i + 1 }));
    mockedQuestionsService.listByReading.mockResolvedValue(questions);
    mockedReadingsService.publish.mockRejectedValue(
      new ApiError('La lectura necesita al menos 5 preguntas aprobadas para publicarse', 400),
    );
    renderPage();

    await waitFor(() => expect(screen.getByRole('button', { name: /publicar lectura/i })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: /publicar lectura/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('La lectura necesita al menos 5 preguntas aprobadas para publicarse'),
    );
  });

  it('should open the add question modal when clicking "Agregar pregunta"', async () => {
    const user = userEvent.setup();
    mockedQuestionsService.listByReading.mockResolvedValue([]);
    renderPage();

    await waitFor(() => expect(screen.getByRole('button', { name: /agregar pregunta/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /agregar pregunta/i }));

    expect(screen.getByRole('heading', { name: /nueva pregunta/i })).toBeInTheDocument();
  });
});
