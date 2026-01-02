import React, { forwardRef, useState } from 'react';
import { clsx } from 'clsx';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled' | 'ghost';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  variant?: InputVariant;
  error?: boolean;
  errorMessage?: string;
  label?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  fullWidth?: boolean;
  onClear?: () => void;
  showClearButton?: boolean;
}

const sizeStyles: Record<InputSize, { input: string; icon: string; addon: string }> = {
  sm: {
    input: 'h-7 px-2 text-xs',
    icon: 'w-3.5 h-3.5',
    addon: 'px-2 text-xs',
  },
  md: {
    input: 'h-8 px-3 text-sm',
    icon: 'w-4 h-4',
    addon: 'px-3 text-sm',
  },
  lg: {
    input: 'h-10 px-4 text-base',
    icon: 'w-5 h-5',
    addon: 'px-4 text-base',
  },
};

const variantStyles: Record<InputVariant, string> = {
  default: `
    bg-[var(--dm-bg-secondary)] border border-[var(--dm-border-primary)]
    hover:border-[var(--dm-border-secondary)]
    focus:border-[var(--dm-border-focus)] focus:ring-1 focus:ring-[var(--dm-ring-color)]
  `,
  filled: `
    bg-[var(--dm-bg-tertiary)] border border-transparent
    hover:bg-[var(--dm-bg-hover)]
    focus:bg-[var(--dm-bg-secondary)] focus:border-[var(--dm-border-focus)]
  `,
  ghost: `
    bg-transparent border border-transparent
    hover:bg-[var(--dm-bg-hover)]
    focus:bg-[var(--dm-bg-secondary)] focus:border-[var(--dm-border-focus)]
  `,
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      variant = 'default',
      error = false,
      errorMessage,
      label,
      hint,
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      fullWidth = false,
      onClear,
      showClearButton = false,
      disabled,
      className,
      id,
      value,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    const hasValue = value !== undefined && value !== '';
    const showClear = showClearButton && hasValue && !disabled;

    return (
      <div className={clsx('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[var(--dm-text-secondary)]"
          >
            {label}
          </label>
        )}
        
        <div
          className={clsx(
            'flex items-center rounded-md overflow-hidden',
            'transition-all duration-150',
            variantStyles[variant],
            error && 'border-[var(--dm-border-error)] focus-within:border-[var(--dm-border-error)] focus-within:ring-[var(--dm-error-muted)]',
            disabled && 'opacity-50 cursor-not-allowed',
            focused && !error && 'ring-1 ring-[var(--dm-ring-color)]',
            fullWidth && 'w-full'
          )}
        >
          {leftAddon && (
            <div
              className={clsx(
                'flex items-center bg-[var(--dm-bg-tertiary)] border-r border-[var(--dm-border-primary)]',
                'text-[var(--dm-text-secondary)]',
                sizeStyles[size].addon
              )}
            >
              {leftAddon}
            </div>
          )}
          
          {leftIcon && (
            <div
              className={clsx(
                'flex items-center justify-center pl-3 text-[var(--dm-text-muted)]',
                sizeStyles[size].icon
              )}
            >
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            value={value}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            className={clsx(
              'flex-1 bg-transparent outline-none',
              'text-[var(--dm-text-primary)] placeholder:text-[var(--dm-text-muted)]',
              sizeStyles[size].input,
              leftIcon && 'pl-2',
              (rightIcon || showClear) && 'pr-2',
              disabled && 'cursor-not-allowed',
              className
            )}
            {...props}
          />
          
          {showClear && (
            <button
              type="button"
              onClick={onClear}
              className={clsx(
                'flex items-center justify-center pr-2 text-[var(--dm-text-muted)]',
                'hover:text-[var(--dm-text-secondary)] transition-colors',
                sizeStyles[size].icon
              )}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {rightIcon && !showClear && (
            <div
              className={clsx(
                'flex items-center justify-center pr-3 text-[var(--dm-text-muted)]',
                sizeStyles[size].icon
              )}
            >
              {rightIcon}
            </div>
          )}
          
          {rightAddon && (
            <div
              className={clsx(
                'flex items-center bg-[var(--dm-bg-tertiary)] border-l border-[var(--dm-border-primary)]',
                'text-[var(--dm-text-secondary)]',
                sizeStyles[size].addon
              )}
            >
              {rightAddon}
            </div>
          )}
        </div>
        
        {(errorMessage || hint) && (
          <p
            className={clsx(
              'text-[11px]',
              error ? 'text-[var(--dm-error)]' : 'text-[var(--dm-text-muted)]'
            )}
          >
            {error ? errorMessage : hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
