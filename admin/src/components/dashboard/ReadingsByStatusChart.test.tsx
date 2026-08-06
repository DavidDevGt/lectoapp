import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MockResponsiveContainer } from '../../test/mockRecharts';
import { ReadingsByStatusChart } from './ReadingsByStatusChart';

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return { ...actual, ResponsiveContainer: MockResponsiveContainer };
});

describe('ReadingsByStatusChart', () => {
  it('should render the chart container when there is at least one reading', () => {
    render(<ReadingsByStatusChart byStatus={{ DRAFT: 4, PUBLISHED: 7, ARCHIVED: 1 }} />);

    expect(screen.getByTestId('chart-readings-by-status')).toBeInTheDocument();
    expect(screen.queryByText(/sin datos suficientes/i)).not.toBeInTheDocument();
  });

  it('should show "Sin datos suficientes" instead of an empty chart when all counts are 0', () => {
    render(<ReadingsByStatusChart byStatus={{ DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 }} />);

    expect(screen.getByTestId('chart-readings-by-status')).toBeInTheDocument();
    expect(screen.getByText(/sin datos suficientes/i)).toBeInTheDocument();
  });
});
