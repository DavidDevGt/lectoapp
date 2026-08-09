import type { Meta, StoryObj } from '@storybook/react-vite';
import { QuestionCard } from './QuestionCard';
import { buildAdminQuestion } from '../../test/fixtures';

const meta = {
  title: 'Preguntas/QuestionCard',
  component: QuestionCard,
  args: {
    onEdit: () => {},
    onDelete: () => {},
    onApprove: () => {},
    isApproving: false,
  },
} satisfies Meta<typeof QuestionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Borrador: Story = {
  args: { question: buildAdminQuestion({ status: 'DRAFT' }) },
};

export const Aprobada: Story = {
  args: { question: buildAdminQuestion({ status: 'APPROVED' }) },
};

/**
 * El caso que motiva todo el flujo editorial: la IA genera preguntas en estado
 * borrador y el docente las revisa. El ámbar de "Generada por IA" está reservado
 * en exclusiva a este estado — ningún nivel pedagógico usa ámbar.
 */
export const GeneradaPorIaPendiente: Story = {
  args: {
    question: buildAdminQuestion({
      status: 'DRAFT',
      isAiGenerated: true,
      explanation: 'El texto menciona explícitamente que el quetzal es el ave nacional.',
    }),
  },
};

export const AprobandoEnCurso: Story = {
  args: {
    question: buildAdminQuestion({ status: 'DRAFT', isAiGenerated: true }),
    isApproving: true,
  },
};

export const VerdaderoFalso: Story = {
  args: {
    question: buildAdminQuestion({
      type: 'TRUE_FALSE',
      statement: 'El quetzal aparece en la bandera de Guatemala.',
      options: [
        { id: 'true', text: 'Verdadero' },
        { id: 'false', text: 'Falso' },
      ],
      correctAnswer: 'true',
    }),
  },
};
