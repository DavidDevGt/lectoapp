import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MockResponsiveContainer } from '../../test/mockRecharts';
import { TopReadingsChart } from './TopReadingsChart';
import { TopReadingStat } from '../../types/api';

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return { ...actual, ResponsiveContainer: MockResponsiveContainer };
});

function makeTopReadings(count: number): TopReadingStat[] {
  return Array.from({ length: count }, (_, i) => ({
    readingId: `r${i}`,
    title: `Lectura ${i}`,
    completions: count - i,
    averageScorePercentage: 80,
  }));
}

describe('TopReadingsChart', () => {
  it('should render the chart container with one bar per reading', () => {
    render(<TopReadingsChart topReadings={makeTopReadings(3)} />);

    expect(screen.getByTestId('chart-top-readings')).toBeInTheDocument();
    expect(screen.getAllByTestId('top-reading-bar')).toHaveLength(3);
  });

  it('should cap the rendered bars at 5 even with more items', () => {
    render(<TopReadingsChart topReadings={makeTopReadings(8)} />);

    expect(screen.getAllByTestId('top-reading-bar')).toHaveLength(5);
  });

  it('should show "Sin datos suficientes" inside the chart container when there are no top readings', () => {
    render(<TopReadingsChart topReadings={[]} />);

    const container = screen.getByTestId('chart-top-readings');
    expect(container).toBeInTheDocument();
    expect(screen.getByText(/sin datos suficientes/i)).toBeInTheDocument();
    expect(screen.queryByTestId('top-reading-bar')).not.toBeInTheDocument();
  });
});
