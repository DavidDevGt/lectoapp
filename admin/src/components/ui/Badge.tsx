import { HTMLAttributes, ReactNode } from 'react';
import styles from './Badge.module.css';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'draft' | 'published' | 'archived' | 'approved' | 'brand' | 'ai';
  children: ReactNode;
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  const combinedClassName = [
    styles.badge,
    styles[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={combinedClassName} {...props}>
      {children}
    </span>
  );
}
