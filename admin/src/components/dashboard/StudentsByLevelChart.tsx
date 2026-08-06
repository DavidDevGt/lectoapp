import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import { ProgressionLevel } from '../../types/api';
import { PROGRESSION_LEVEL_LABEL, PROGRESSION_LEVEL_ORDER } from '../../utils/labels';

interface StudentsByLevelChartProps {
  byProgressionLevel: Partial<Record<ProgressionLevel, number>>;
}

export function StudentsByLevelChart({ byProgressionLevel }: StudentsByLevelChartProps) {
  const data = PROGRESSION_LEVEL_ORDER.map((level) => ({
    name: PROGRESSION_LEVEL_LABEL[level],
    total: byProgressionLevel[level] ?? 0,
  }));

  const hasData = data.some((item) => item.total > 0);

  return (
    <ChartCard title="Estudiantes por nivel de progresión" testId="chart-students-by-level" hasData={hasData}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="total" fill="#16a34a" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
