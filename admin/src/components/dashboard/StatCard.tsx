import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  to?: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, hint, to, icon }: StatCardProps) {
  return (
    <article className={styles.card} aria-label={label}>
      <div className={styles.header}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <p className={styles.label}>{label}</p>
      </div>

      <p className={styles.value}>{value}</p>

      {to ? (
        <Link to={to} className={styles.hintLink}>
          {hint ?? 'Ver más'}
        </Link>
      ) : (
        hint && <p className={styles.hint}>{hint}</p>
      )}
    </article>
  );
}
