import React, { useState, useRef, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';

export type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
};

export interface MobileNavProps {
  items: NavItem[];
  activeItem?: string;
  onItemSelect?: (id: string) => void;
  position?: 'bottom' | 'top';
  variant?: 'default' | 'floating' | 'minimal';
  showLabels?: boolean;
  className?: string;
}

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right' | 'bottom';
  children: React.ReactNode;
  title?: string;
  className?: string;
}

// Swipe gesture hook
function useSwipeGesture(
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void,
  threshold = 50
) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;

      const deltaX = e.changedTouches[0].clientX - touchStart.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStart.current.y;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > threshold) {
          onSwipe(deltaX > 0 ? 'right' : 'left');
        }
      } else {
        if (Math.abs(deltaY) > threshold) {
          onSwipe(deltaY > 0 ? 'down' : 'up');
        }
      }

      touchStart.current = null;
    },
    [onSwipe, threshold]
  );

  return { handleTouchStart, handleTouchEnd };
}

// Mobile Navigation Bar
export const MobileNav: React.FC<MobileNavProps> = ({
  items,
  activeItem,
  onItemSelect,
  position = 'bottom',
  variant = 'default',
  showLabels = true,
  className,
}) => {
  const variantStyles = {
    default: 'bg-[var(--dm-bg-secondary)] border-[var(--dm-border-primary)]',
    floating: 'bg-[var(--dm-surface-card)] rounded-2xl shadow-xl mx-4 mb-4 border border-[var(--dm-border-subtle)]',
    minimal: 'bg-transparent',
  };

  const positionStyles = {
    bottom: 'bottom-0 left-0 right-0 border-t',
    top: 'top-0 left-0 right-0 border-b',
  };

  return (
    <nav
      className={clsx(
        'fixed z-[var(--dm-z-fixed)] safe-area-inset-bottom',
        position === 'bottom' ? positionStyles.bottom : positionStyles.top,
        variant !== 'floating' && variantStyles[variant],
        variant === 'floating' && 'bottom-0 left-0 right-0',
        className
      )}
    >
      <div
        className={clsx(
          'flex items-center justify-around',
          variant === 'floating' && variantStyles.floating,
          variant !== 'floating' && 'px-2 py-1'
        )}
      >
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => !item.disabled && onItemSelect?.(item.id)}
            disabled={item.disabled}
            className={clsx(
              'flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[64px]',
              'transition-all duration-150',
              'rounded-lg',
              activeItem === item.id
                ? 'text-[var(--dm-accent-primary)] bg-[var(--dm-accent-primary-subtle)]'
                : 'text-[var(--dm-text-secondary)] hover:text-[var(--dm-text-primary)] hover:bg-[var(--dm-bg-hover)]',
              item.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="relative">
              <span className="w-6 h-6 flex items-center justify-center">
                {item.icon}
              </span>
              {item.badge !== undefined && (
                <span
                  className={clsx(
                    'absolute -top-1 -right-1 min-w-[16px] h-4 px-1',
                    'flex items-center justify-center',
                    'text-[10px] font-bold rounded-full',
                    'bg-[var(--dm-error)] text-white'
                  )}
                >
                  {typeof item.badge === 'number' && item.badge > 99
                    ? '99+'
                    : item.badge}
                </span>
              )}
            </div>
            {showLabels && (
              <span className="text-[10px] font-medium">{item.label}</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

// Mobile Drawer (slide-in panel)
export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  position = 'left',
  children,
  title,
  className,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const { handleTouchStart, handleTouchEnd } = useSwipeGesture(
    (direction) => {
      if (
        (position === 'left' && direction === 'left') ||
        (position === 'right' && direction === 'right') ||
        (position === 'bottom' && direction === 'down')
      ) {
        onClose();
      }
    },
    100
  );

  // Handle drag to close
  const handleDragStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    handleTouchStart(e);
  }, [handleTouchStart]);

  const handleDragMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;

      const touch = e.touches[0];
      const rect = drawerRef.current?.getBoundingClientRect();
      if (!rect) return;

      let offset = 0;
      if (position === 'left') {
        offset = Math.max(0, rect.left - touch.clientX);
      } else if (position === 'right') {
        offset = Math.max(0, touch.clientX - rect.right + rect.width);
      } else if (position === 'bottom') {
        offset = Math.max(0, touch.clientY - rect.top);
      }

      setDragOffset(offset);
    },
    [isDragging, position]
  );

  const handleDragEnd = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(false);
      handleTouchEnd(e);

      // If dragged more than 30%, close
      const threshold = position === 'bottom' ? 150 : 100;
      if (dragOffset > threshold) {
        onClose();
      }
      setDragOffset(0);
    },
    [dragOffset, handleTouchEnd, onClose, position]
  );

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const positionStyles = {
    left: {
      container: 'left-0 top-0 bottom-0',
      transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
      dragTransform: `translateX(-${dragOffset}px)`,
      size: 'w-[85vw] max-w-[320px] h-full',
    },
    right: {
      container: 'right-0 top-0 bottom-0',
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      dragTransform: `translateX(${dragOffset}px)`,
      size: 'w-[85vw] max-w-[320px] h-full',
    },
    bottom: {
      container: 'left-0 right-0 bottom-0',
      transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
      dragTransform: `translateY(${dragOffset}px)`,
      size: 'w-full max-h-[85vh]',
    },
  };

  const styles = positionStyles[position];

  if (!isOpen && dragOffset === 0) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 z-[var(--dm-z-modal-backdrop)]',
          'bg-black/50 backdrop-blur-sm',
          'transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={clsx(
          'fixed z-[var(--dm-z-modal)]',
          styles.container,
          styles.size,
          'bg-[var(--dm-bg-primary)] shadow-2xl',
          position === 'bottom' && 'rounded-t-2xl',
          'transition-transform duration-300 ease-out',
          className
        )}
        style={{
          transform: isDragging ? styles.dragTransform : styles.transform,
        }}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        {/* Drag handle for bottom drawer */}
        {position === 'bottom' && (
          <div className="flex justify-center py-3">
            <div className="w-10 h-1 rounded-full bg-[var(--dm-border-secondary)]" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--dm-border-primary)]">
            <h2 className="text-lg font-semibold text-[var(--dm-text-primary)]">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-[var(--dm-text-muted)] hover:text-[var(--dm-text-primary)] hover:bg-[var(--dm-bg-hover)] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </>
  );
};

// Mobile Action Sheet
export interface ActionSheetItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}

export interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: ActionSheetItem[];
  onSelect: (id: string) => void;
  title?: string;
  cancelLabel?: string;
}

export const MobileActionSheet: React.FC<MobileActionSheetProps> = ({
  isOpen,
  onClose,
  items,
  onSelect,
  title,
  cancelLabel = 'Cancel',
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[var(--dm-z-modal-backdrop)] bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed left-4 right-4 bottom-4 z-[var(--dm-z-modal)] animate-slide-up">
        <div className="bg-[var(--dm-surface-card)] rounded-2xl overflow-hidden shadow-2xl">
          {title && (
            <div className="px-4 py-3 text-center border-b border-[var(--dm-border-primary)]">
              <p className="text-sm text-[var(--dm-text-secondary)]">{title}</p>
            </div>
          )}

          {items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => {
                if (!item.disabled) {
                  onSelect(item.id);
                  onClose();
                }
              }}
              disabled={item.disabled}
              className={clsx(
                'w-full flex items-center justify-center gap-3 px-4 py-4',
                'text-base font-medium',
                'transition-colors',
                index > 0 && 'border-t border-[var(--dm-border-primary)]',
                item.destructive
                  ? 'text-[var(--dm-error)] hover:bg-[var(--dm-error-bg)]'
                  : 'text-[var(--dm-text-primary)] hover:bg-[var(--dm-bg-hover)]',
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {item.icon && <span className="w-5 h-5">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>

        {/* Cancel button */}
        <button
          onClick={onClose}
          className={clsx(
            'w-full mt-2 px-4 py-4',
            'bg-[var(--dm-surface-card)] rounded-2xl',
            'text-base font-semibold text-[var(--dm-accent-primary)]',
            'hover:bg-[var(--dm-bg-hover)] transition-colors'
          )}
        >
          {cancelLabel}
        </button>
      </div>
    </>
  );
};

export default MobileNav;
