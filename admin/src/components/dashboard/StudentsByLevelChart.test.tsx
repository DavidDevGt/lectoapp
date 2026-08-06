import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MockResponsiveContainer } from '../../test/mockRecharts';
import { StudentsByLevelChart } from './StudentsByLevelChart';

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return { ...actual, ResponsiveContainer: MockResponsiveContainer };
});

describe('StudentsByLevelChart', () => {
  it('should render the chart container in Principiante->Supremo order', () => {
    render(
      <StudentsByLevelChart
        byProgressionLevel={{ BEGINNER: 20, INTERMEDIATE: 12, ADVANCED: 5, EXPERT: 2, SUPREME: 1 }}
      />,
    );

    const container = screen.getByTestId('chart-students-by-level');
    expect(container).toBeInTheDocument();

    const labels = within(container)
      .getAllByText(/principiante|intermedio|avanzado|experto|supremo/i)
      .map((el) => el.textContent);
    expect(labels).toEqual(['Principiante', 'Intermedio', 'Avanzado', 'Experto', 'Supremo']);
  });

  it('should treat a missing progression level key as 0 without throwing', () => {
    render(
      <StudentsByLevelChart
        byProgressionLevel={{ BEGINNER: 20, INTERMEDIATE: 12, ADVANCED: 5, EXPERT: 2 }}
      />,
    );

    expect(screen.getByTestId('chart-students-by-level')).toBeInTheDocument();
    expect(screen.getByText(/supremo/i)).toBeInTheDocument();
  });

  it('should show "Sin datos suficientes" when every level has 0 students', () => {
    render(
      <StudentsByLevelChart
        byProgressionLevel={{ BEGINNER: 0, INTERMEDIATE: 0, ADVANCED: 0, EXPERT: 0, SUPREME: 0 }}
      />,
    );

    expect(screen.getByText(/sin datos suficientes/i)).toBeInTheDocument();
  });
});
