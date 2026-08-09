import React, { ButtonHTMLAttributes, ReactNode, ElementType } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'ai';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  as?: ElementType;
  to?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      children,
      type = 'button',
      as: Component = 'button',
      ...props
    },
    ref,
  ) => {
    const combinedClassName = [
      styles.button,
      styles[variant],
      styles[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const componentProps = Component === 'button'
      ? { type, disabled: disabled || isLoading, ref, ...props }
      : { ref, ...props };

    return (
      <Component className={combinedClassName} {...componentProps}>
        {isLoading ? (
          <span className={styles.spinner} aria-hidden="true" data-testid="button-spinner" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </Component>
    );
  },
);

Button.displayName = 'Button';
