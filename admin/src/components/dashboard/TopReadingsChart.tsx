import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import { TopReadingStat } from '../../types/api';
import { chartColors } from '../../styles/tokens';

const MAX_BARS = 5;

interface TopReadingBarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
}

function renderTopReadingBar(props: unknown) {
  const { x, y, width, height, fill } = props as TopReadingBarShapeProps;
  return <rect data-testid="top-reading-bar" x={x} y={y} width={width} height={height} fill={fill} />;
}

interface TopReadingsChartProps {
  topReadings: TopReadingStat[];
}

export function TopReadingsChart({ topReadings }: TopReadingsChartProps) {
  const data = [...topReadings].sort((a, b) => b.completions - a.completions).slice(0, MAX_BARS);
  const hasData = data.length > 0;

  return (
    <ChartCard title={`Top ${MAX_BARS} lecturas más completadas`} testId="chart-top-readings" hasData={hasData}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
          <XAxis type="number" allowDecimals={false} stroke={chartColors.axis} />
          <YAxis type="category" dataKey="title" width={140} stroke={chartColors.axis} />
          <Tooltip />
          {/* Ranking de una sola serie: acento de marca, sin codificar categoría. */}
          <Bar dataKey="completions" fill={chartColors.accent} shape={renderTopReadingBar} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
