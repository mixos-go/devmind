import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[var(--dm-accent-primary)] text-white
    hover:bg-[var(--dm-accent-primary-hover)]
    active:bg-[var(--dm-accent-primary-active)]
    shadow-sm hover:shadow-md
  `,
  secondary: `
    bg-[var(--dm-bg-tertiary)] text-[var(--dm-text-primary)]
    hover:bg-[var(--dm-bg-hover)]
    active:bg-[var(--dm-bg-active)]
    border border-[var(--dm-border-primary)]
  `,
  ghost: `
    bg-transparent text-[var(--dm-text-secondary)]
    hover:bg-[var(--dm-bg-hover)] hover:text-[var(--dm-text-primary)]
    active:bg-[var(--dm-bg-active)]
  `,
  danger: `
    bg-[var(--dm-error)] text-white
    hover:bg-[var(--dm-error-hover)]
    active:opacity-90
    shadow-sm
  `,
  success: `
    bg-[var(--dm-success)] text-white
    hover:bg-[var(--dm-success-hover)]
    active:opacity-90
    shadow-sm
  `,
  outline: `
    bg-transparent text-[var(--dm-accent-primary)]
    border border-[var(--dm-accent-primary)]
    hover:bg-[var(--dm-accent-primary-subtle)]
    active:bg-[var(--dm-accent-primary-muted)]
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-6 px-2 text-[11px] gap-1 rounded',
  sm: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  md: 'h-8 px-3 text-sm gap-2 rounded-md',
  lg: 'h-10 px-4 text-base gap-2 rounded-lg',
};

const iconSizeStyles: Record<ButtonSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          // Base styles
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-150 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dm-ring-color)] focus-visible:ring-offset-1',
          'select-none whitespace-nowrap',
          // Variant & Size
          variantStyles[variant],
          sizeStyles[size],
          // States
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className={clsx('animate-spin', iconSizeStyles[size])}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span className={iconSizeStyles[size]}>{icon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && icon && iconPosition === 'right' && (
          <span className={iconSizeStyles[size]}>{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
