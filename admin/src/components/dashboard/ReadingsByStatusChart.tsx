import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import { ReadingStatus } from '../../types/api';
import { READING_STATUS_LABEL, READING_STATUS_ORDER } from '../../utils/labels';

interface ReadingsByStatusChartProps {
  byStatus: Record<ReadingStatus, number>;
}

export function ReadingsByStatusChart({ byStatus }: ReadingsByStatusChartProps) {
  const data = READING_STATUS_ORDER.map((status) => ({
    name: READING_STATUS_LABEL[status],
    total: byStatus[status] ?? 0,
  }));

  const hasData = data.some((item) => item.total > 0);

  return (
    <ChartCard title="Lecturas por estado" testId="chart-readings-by-status" hasData={hasData}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="total" fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
