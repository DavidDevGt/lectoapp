import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/renderWithProviders';
import { QuestionCard } from './QuestionCard';
import { AdminQuestion } from '../../types/api';

const baseQuestion: AdminQuestion = {
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
  explanation: 'La capital es Ciudad de Guatemala.',
  order: 1,
  isAiGenerated: false,
  status: 'DRAFT',
};

describe('QuestionCard', () => {
  it('should render as an article with the order, statement and explanation', () => {
    renderWithProviders(
      <QuestionCard question={baseQuestion} onEdit={vi.fn()} onDelete={vi.fn()} onApprove={vi.fn()} isApproving={false} />,
    );

    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('data-status', 'DRAFT');
    expect(screen.getByText(/¿cuál es la capital de guatemala\?/i)).toBeInTheDocument();
    expect(screen.getByText(/la capital es ciudad de guatemala/i)).toBeInTheDocument();
  });

  it('should mark the correct option with accessible text, not only color', () => {
    renderWithProviders(
      <QuestionCard question={baseQuestion} onEdit={vi.fn()} onDelete={vi.fn()} onApprove={vi.fn()} isApproving={false} />,
    );

    expect(screen.getByText(/respuesta correcta/i)).toBeInTheDocument();
  });

  it('should show only "Borrador" badge when the question is manual and not approved', () => {
    renderWithProviders(
      <QuestionCard question={baseQuestion} onEdit={vi.fn()} onDelete={vi.fn()} onApprove={vi.fn()} isApproving={false} />,
    );

    expect(screen.getByText(/borrador/i)).toBeInTheDocument();
    expect(screen.queryByText(/generada por ia/i)).not.toBeInTheDocument();
  });

  it('should show both AI-generated and Borrador badges for AI draft questions', () => {
    renderWithProviders(
      <QuestionCard
        question={{ ...baseQuestion, isAiGenerated: true }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onApprove={vi.fn()}
        isApproving={false}
      />,
    );

    expect(screen.getByText(/generada por ia/i)).toBeInTheDocument();
    expect(screen.getByText(/borrador/i)).toBeInTheDocument();
  });

  it('should show the approve button for a DRAFT question and call onApprove when clicked', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    renderWithProviders(
      <QuestionCard question={baseQuestion} onEdit={vi.fn()} onDelete={vi.fn()} onApprove={onApprove} isApproving={false} />,
    );

    await user.click(screen.getByRole('button', { name: /aprobar/i }));
    expect(onApprove).toHaveBeenCalledWith('q1');
  });

  it('should not show the approve button for an APPROVED question', () => {
    renderWithProviders(
      <QuestionCard
        question={{ ...baseQuestion, status: 'APPROVED' }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onApprove={vi.fn()}
        isApproving={false}
      />,
    );

    expect(screen.queryByRole('button', { name: /aprobar/i })).not.toBeInTheDocument();
  });

  it('should call onEdit and onDelete with the question id when clicking their buttons', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    renderWithProviders(
      <QuestionCard question={baseQuestion} onEdit={onEdit} onDelete={onDelete} onApprove={vi.fn()} isApproving={false} />,
    );

    await user.click(screen.getByRole('button', { name: /editar/i }));
    expect(onEdit).toHaveBeenCalledWith('q1');

    await user.click(screen.getByRole('button', { name: /eliminar/i }));
    expect(onDelete).toHaveBeenCalledWith('q1');
  });
});
