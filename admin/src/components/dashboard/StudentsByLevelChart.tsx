import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import { ProgressionLevel } from '../../types/api';
import { PROGRESSION_LEVEL_LABEL, PROGRESSION_LEVEL_ORDER } from '../../utils/labels';
import { chartColors } from '../../styles/tokens';

interface StudentsByLevelChartProps {
  byProgressionLevel: Partial<Record<ProgressionLevel, number>>;
}

export function StudentsByLevelChart({ byProgressionLevel }: StudentsByLevelChartProps) {
  // La progresión es una escala ordenada, así que cada nivel lleva su propio
  // color de la rampa de logro en vez de un único relleno para las cinco barras.
  const data = PROGRESSION_LEVEL_ORDER.map((level) => ({
    name: PROGRESSION_LEVEL_LABEL[level],
    total: byProgressionLevel[level] ?? 0,
    fill: chartColors.progression[level],
  }));

  const hasData = data.some((item) => item.total > 0);

  return (
    <ChartCard title="Estudiantes por nivel de progresión" testId="chart-students-by-level" hasData={hasData}>
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
