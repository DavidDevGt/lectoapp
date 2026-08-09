import { HTMLAttributes } from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export function Skeleton({ width, height, borderRadius, style, className, ...props }: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${className ?? ''}`}
      style={{
        width: width ?? '100%',
        height: height ?? '20px',
        borderRadius: borderRadius ?? undefined,
        ...style,
      }}
      data-testid="skeleton-placeholder"
      {...props}
    />
  );
}
