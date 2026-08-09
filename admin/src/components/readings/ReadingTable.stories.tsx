import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReadingTable } from './ReadingTable';
import { buildReadingListItem } from '../../test/fixtures';

const meta = {
  title: 'Lecturas/ReadingTable',
  component: ReadingTable,
  args: { onEdit: () => {}, isLoading: false },
} satisfies Meta<typeof ReadingTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TodosLosEstados: Story = {
  args: {
    readings: [
      buildReadingListItem({ id: 'r1', title: 'El quetzal y la montaña', status: 'DRAFT' }),
      buildReadingListItem({
        id: 'r2',
        title: 'La leyenda del Sombrerón',
        status: 'PUBLISHED',
        comprehensionLevel: 'INFERENTIAL',
        questionsCount: 5,
      }),
      buildReadingListItem({
        id: 'r3',
        title: 'El lago de Atitlán',
        status: 'ARCHIVED',
        comprehensionLevel: 'CRITICAL',
        questionsCount: 8,
      }),
    ],
  },
};

export const SinLecturas: Story = {
  args: { readings: [] },
};

export const Cargando: Story = {
  args: { readings: [], isLoading: true },
};
