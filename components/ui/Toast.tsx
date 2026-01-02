import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { clsx } from 'clsx';

// Types
export type ToastType = 'info' | 'success' | 'warning' | 'error';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface ToastData {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

interface ToastContextValue {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

// Toast Provider
export interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'bottom-right',
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback(
    (toast: Omit<ToastData, 'id'>) => {
      const id = `toast-${++toastIdRef.current}`;
      const newToast: ToastData = {
        ...toast,
        id,
        duration: toast.duration ?? 5000,
        dismissible: toast.dismissible ?? true,
      };

      setToasts((prev) => {
        const updated = [...prev, newToast];
        return updated.slice(-maxToasts);
      });

      return id;
    },
    [maxToasts]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const positionStyles: Record<ToastPosition, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <div
        className={clsx(
          'fixed z-[var(--dm-z-toast)] flex flex-col gap-2 pointer-events-none',
          positionStyles[position]
        )}
        style={{ maxWidth: '400px' }}
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Toast Component
interface ToastProps extends ToastData {
  onDismiss: () => void;
}

const typeStyles: Record<ToastType, { bg: string; icon: string; border: string }> = {
  info: {
    bg: 'bg-[var(--dm-info-bg)]',
    icon: 'text-[var(--dm-info)]',
    border: 'border-[var(--dm-info)]',
  },
  success: {
    bg: 'bg-[var(--dm-success-bg)]',
    icon: 'text-[var(--dm-success)]',
    border: 'border-[var(--dm-success)]',
  },
  warning: {
    bg: 'bg-[var(--dm-warning-bg)]',
    icon: 'text-[var(--dm-warning)]',
    border: 'border-[var(--dm-warning)]',
  },
  error: {
    bg: 'bg-[var(--dm-error-bg)]',
    icon: 'text-[var(--dm-error)]',
    border: 'border-[var(--dm-error)]',
  },
};

const icons: Record<ToastType, React.ReactNode> = {
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  ),
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration,
  action,
  dismissible,
  onDismiss,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (duration && duration > 0) {
      timerRef.current = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onDismiss, 200);
      }, duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [duration, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 200);
  };

  const styles = typeStyles[type];

  return (
    <div
      role="alert"
      className={clsx(
        'pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-lg',
        'border-l-4 backdrop-blur-sm',
        'transition-all duration-200',
        styles.bg,
        styles.border,
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0 animate-slide-up'
      )}
    >
      <div className={clsx('w-5 h-5 flex-shrink-0 mt-0.5', styles.icon)}>
        {icons[type]}
      </div>

      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-semibold text-[var(--dm-text-primary)] mb-1">
            {title}
          </p>
        )}
        <p className="text-sm text-[var(--dm-text-secondary)]">{message}</p>
        
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium text-[var(--dm-accent-primary)] hover:text-[var(--dm-accent-primary-hover)] transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>

      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-[var(--dm-text-muted)] hover:text-[var(--dm-text-primary)] transition-colors rounded"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Helper functions for quick toast creation
export const toast = {
  info: (message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>) => ({
    type: 'info' as const,
    message,
    ...options,
  }),
  success: (message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>) => ({
    type: 'success' as const,
    message,
    ...options,
  }),
  warning: (message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>) => ({
    type: 'warning' as const,
    message,
    ...options,
  }),
  error: (message: string, options?: Partial<Omit<ToastData, 'id' | 'type' | 'message'>>) => ({
    type: 'error' as const,
    message,
    ...options,
  }),
};

export default Toast;
