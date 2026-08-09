import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import { ReadingStatus } from '../../types/api';
import { READING_STATUS_LABEL, READING_STATUS_ORDER } from '../../utils/labels';
import { chartColors } from '../../styles/tokens';

interface ReadingsByStatusChartProps {
  byStatus: Record<ReadingStatus, number>;
}

export function ReadingsByStatusChart({ byStatus }: ReadingsByStatusChartProps) {
  // Cada barra lleva el color de su propio estado: el mismo verde de "publicada"
  // que usan los badges de la tabla, para que el estado se lea igual en todo el panel.
  const data = READING_STATUS_ORDER.map((status) => ({
    name: READING_STATUS_LABEL[status],
    total: byStatus[status] ?? 0,
    fill: chartColors.readingStatus[status],
  }));

  const hasData = data.some((item) => item.total > 0);

  return (
    <ChartCard title="Lecturas por estado" testId="chart-readings-by-status" hasData={hasData}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
          <XAxis dataKey="name" stroke={chartColors.axis} />
          <YAxis allowDecimals={false} stroke={chartColors.axis} />
          <Tooltip />
          <Bar dataKey="total">
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
