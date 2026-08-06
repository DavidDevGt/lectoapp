import { ReactNode } from 'react';
import styles from './ChartCard.module.css';

const DEFAULT_EMPTY_MESSAGE = 'Sin datos suficientes';

interface ChartCardProps {
  title: string;
  testId: string;
  hasData: boolean;
  emptyMessage?: string;
  children: ReactNode;
}

/**
 * Shared frame for dashboard bar charts: title, fixed-height responsive
 * area, and an "empty" fallback when there is no data to plot. Individual
 * charts only need to provide their `recharts` tree as children.
 */
export function ChartCard({ title, testId, hasData, emptyMessage = DEFAULT_EMPTY_MESSAGE, children }: ChartCardProps) {
  return (
    <div className={styles.container} data-testid={testId}>
      <p className={styles.title}>{title}</p>

      {hasData ? children : <p className={styles.empty}>{emptyMessage}</p>}
    </div>
  );
}
