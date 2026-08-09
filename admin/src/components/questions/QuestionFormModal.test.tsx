import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { renderWithProviders } from '../../test/renderWithProviders';
import { questionsService } from '../../services/questions.service';
import { QuestionFormModal } from './QuestionFormModal';
import { AdminQuestion } from '../../types/api';

vi.mock('../../services/questions.service');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockedQuestionsService = vi.mocked(questionsService, true);

function at<T>(items: T[], index: number): T {
  const item = items[index];
  if (item === undefined) {
    throw new Error(`No item at index ${index}`);
  }
  return item;
}

describe('QuestionFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedQuestionsService.listByReading.mockResolvedValue([
      { id: 'q1' } as AdminQuestion,
      { id: 'q2' } as AdminQuestion,
    ]);
  });

  describe('create mode', () => {
    it('should render 4 option textboxes and 4 radios for MULTIPLE_CHOICE by default', async () => {
      renderWithProviders(<QuestionFormModal readingId="r1" onClose={vi.fn()} />);

      await waitFor(() =>
        expect(screen.getAllByRole('textbox', { name: /opción/i })).toHaveLength(4),
      );
      expect(screen.getAllByRole('radio')).toHaveLength(4);
    });

    it('should switch to 2 radios and 0 option textboxes when changing type to TRUE_FALSE', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<QuestionFormModal readingId="r1" onClose={vi.fn()} />);

      await waitFor(() => expect(screen.getAllByRole('radio')).toHaveLength(4));

      await user.selectOptions(screen.getByLabelText(/tipo de pregunta/i), 'TRUE_FALSE');

      expect(screen.getAllByRole('radio')).toHaveLength(2);
      expect(screen.queryAllByRole('textbox', { name: /opción/i })).toHaveLength(0);
    });

    it('should call questionsService.create with the exact payload on valid submit', async () => {
      const user = userEvent.setup({ delay: null });
      mockedQuestionsService.create.mockResolvedValue({ id: 'q3' } as AdminQuestion);
      const onClose = vi.fn();

      renderWithProviders(<QuestionFormModal readingId="r1" onClose={onClose} />);

      await waitFor(() => expect(screen.getAllByRole('textbox', { name: /opción/i })).toHaveLength(4));

      await user.type(screen.getByLabelText(/enunciado/i), '¿Cuál es la capital de Guatemala?');

      const optionInputs = screen.getAllByRole('textbox', { name: /opción/i });
      await user.type(at(optionInputs, 0), 'Ciudad de Guatemala');
      await user.type(at(optionInputs, 1), 'Antigua');
      await user.type(at(optionInputs, 2), 'Quetzaltenango');
      await user.type(at(optionInputs, 3), 'Escuintla');

      const radios = screen.getAllByRole('radio');
      await user.click(at(radios, 0));

      await user.click(screen.getByRole('button', { name: /guardar/i }));

      await waitFor(() =>
        expect(mockedQuestionsService.create).toHaveBeenCalledWith('r1', {
          statement: '¿Cuál es la capital de Guatemala?',
          type: 'MULTIPLE_CHOICE',
          options: [
            { id: 'a', text: 'Ciudad de Guatemala' },
            { id: 'b', text: 'Antigua' },
            { id: 'c', text: 'Quetzaltenango' },
            { id: 'd', text: 'Escuintla' },
          ],
          correctAnswer: 'a',
          explanation: undefined,
          order: 3,
        }),
      );
      expect(toast.success).toHaveBeenCalledWith('Pregunta creada');
      expect(onClose).toHaveBeenCalled();
    });

    it('should show an inline error and not call the service when an option is empty', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<QuestionFormModal readingId="r1" onClose={vi.fn()} />);

      await waitFor(() => expect(screen.getAllByRole('textbox', { name: /opción/i })).toHaveLength(4));

      await user.type(screen.getByLabelText(/enunciado/i), '¿Cuál es la capital de Guatemala?');
      const radios = screen.getAllByRole('radio');
      await user.click(at(radios, 0));

      await user.click(screen.getByRole('button', { name: /guardar/i }));

      await waitFor(() => expect(screen.getAllByText(/la opción no puede estar vacía/i).length).toBeGreaterThan(0));
      expect(questionsService.create).not.toHaveBeenCalled();
    });

    it('should show an inline error and not call the service when no correct answer is selected', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<QuestionFormModal readingId="r1" onClose={vi.fn()} />);

      await waitFor(() => expect(screen.getAllByRole('textbox', { name: /opción/i })).toHaveLength(4));

      await user.type(screen.getByLabelText(/enunciado/i), '¿Cuál es la capital de Guatemala?');
      const optionInputs = screen.getAllByRole('textbox', { name: /opción/i });
      await user.type(at(optionInputs, 0), 'Ciudad de Guatemala');
      await user.type(at(optionInputs, 1), 'Antigua');
      await user.type(at(optionInputs, 2), 'Quetzaltenango');
      await user.type(at(optionInputs, 3), 'Escuintla');

      await user.click(screen.getByRole('button', { name: /guardar/i }));

      await waitFor(() => expect(screen.getByText(/selecciona la respuesta correcta/i)).toBeInTheDocument());
      expect(questionsService.create).not.toHaveBeenCalled();
    });

    it('should reset correctAnswer when switching from MULTIPLE_CHOICE to TRUE_FALSE', async () => {
      const user = userEvent.setup({ delay: null });
      mockedQuestionsService.create.mockResolvedValue({ id: 'q3' } as AdminQuestion);

      renderWithProviders(<QuestionFormModal readingId="r1" onClose={vi.fn()} />);

      await waitFor(() => expect(screen.getAllByRole('radio')).toHaveLength(4));

      const radios = screen.getAllByRole('radio');
      await user.click(at(radios, 2)); // 'c'

      await user.selectOptions(screen.getByLabelText(/tipo de pregunta/i), 'TRUE_FALSE');

      await user.type(screen.getByLabelText(/enunciado/i), '¿Guatemala está en Centroamérica?');
      const tfRadios = screen.getAllByRole('radio');
      await user.click(at(tfRadios, 0)); // 'true'

      await user.click(screen.getByRole('button', { name: /guardar/i }));

      await waitFor(() =>
        expect(mockedQuestionsService.create).toHaveBeenCalledWith(
          'r1',
          expect.objectContaining({ correctAnswer: 'true', type: 'TRUE_FALSE' }),
        ),
      );
    });
  });

  describe('edit mode', () => {
    const question: AdminQuestion = {
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
      order: 2,
      isAiGenerated: false,
      status: 'DRAFT',
    };

    it('should populate the form with the question values', async () => {
      renderWithProviders(<QuestionFormModal readingId="r1" question={question} onClose={vi.fn()} />);

      expect(screen.getByLabelText(/enunciado/i)).toHaveValue('¿Cuál es la capital de Guatemala?');
      const optionInputs = screen.getAllByRole('textbox', { name: /opción/i });
      expect(at(optionInputs, 0)).toHaveValue('Ciudad de Guatemala');
    });

    it('should call questionsService.update on submit', async () => {
      const user = userEvent.setup({ delay: null });
      mockedQuestionsService.update.mockResolvedValue({ ...question, statement: 'nuevo' });
      const onClose = vi.fn();

      renderWithProviders(<QuestionFormModal readingId="r1" question={question} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /guardar/i }));

      await waitFor(() => expect(mockedQuestionsService.update).toHaveBeenCalledWith('r1', 'q1', expect.any(Object)));
      expect(toast.success).toHaveBeenCalledWith('Pregunta actualizada');
      expect(onClose).toHaveBeenCalled();
    });
  });
});
