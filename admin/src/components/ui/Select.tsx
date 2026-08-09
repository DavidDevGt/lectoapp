import React, { SelectHTMLAttributes } from 'react';
import styles from './Select.module.css';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const selectClassName = [
      styles.select,
      error ? styles.selectError : undefined,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={styles.wrapper}>
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
          </label>
        )}
        <select ref={ref} id={selectId} className={selectClassName} {...props}>
          {children}
        </select>
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    );
  },
);

Select.displayName = 'Select';
