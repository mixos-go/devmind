import React, { forwardRef, useState, useRef, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';

export type PanelVariant = 'default' | 'elevated' | 'bordered' | 'ghost';
export type ResizeDirection = 'horizontal' | 'vertical' | 'both' | 'none';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: PanelVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  resizable?: ResizeDirection;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  onResize?: (width: number, height: number) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  loading?: boolean;
}

const variantStyles: Record<PanelVariant, string> = {
  default: 'bg-[var(--dm-surface-panel)] border border-[var(--dm-border-primary)]',
  elevated: 'bg-[var(--dm-surface-card)] shadow-lg border border-[var(--dm-border-subtle)]',
  bordered: 'bg-transparent border border-[var(--dm-border-primary)]',
  ghost: 'bg-transparent',
};

const paddingStyles: Record<string, string> = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
};

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  (
    {
      variant = 'default',
      padding = 'none',
      resizable = 'none',
      minWidth = 100,
      maxWidth = 800,
      minHeight = 100,
      maxHeight = 600,
      defaultWidth,
      defaultHeight,
      onResize,
      header,
      footer,
      collapsible = false,
      collapsed: controlledCollapsed,
      onCollapse,
      loading = false,
      className,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const [internalCollapsed, setInternalCollapsed] = useState(false);
    const collapsed = controlledCollapsed ?? internalCollapsed;
    
    const [size, setSize] = useState({
      width: defaultWidth || 0,
      height: defaultHeight || 0,
    });
    
    const panelRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const startSize = useRef({ width: 0, height: 0 });

    const handleCollapse = useCallback(() => {
      const newCollapsed = !collapsed;
      setInternalCollapsed(newCollapsed);
      onCollapse?.(newCollapsed);
    }, [collapsed, onCollapse]);

    const handleMouseDown = useCallback(
      (e: React.MouseEvent, direction: 'h' | 'v' | 'both') => {
        if (resizable === 'none') return;
        
        e.preventDefault();
        isResizing.current = true;
        startPos.current = { x: e.clientX, y: e.clientY };
        
        const rect = panelRef.current?.getBoundingClientRect();
        startSize.current = {
          width: rect?.width || size.width,
          height: rect?.height || size.height,
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
          if (!isResizing.current) return;

          let newWidth = startSize.current.width;
          let newHeight = startSize.current.height;

          if (direction === 'h' || direction === 'both') {
            newWidth = Math.min(
              maxWidth,
              Math.max(minWidth, startSize.current.width + (moveEvent.clientX - startPos.current.x))
            );
          }

          if (direction === 'v' || direction === 'both') {
            newHeight = Math.min(
              maxHeight,
              Math.max(minHeight, startSize.current.height + (moveEvent.clientY - startPos.current.y))
            );
          }

          setSize({ width: newWidth, height: newHeight });
          onResize?.(newWidth, newHeight);
        };

        const handleMouseUp = () => {
          isResizing.current = false;
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      },
      [resizable, minWidth, maxWidth, minHeight, maxHeight, size, onResize]
    );

    const panelStyle: React.CSSProperties = {
      ...style,
      ...(size.width > 0 && resizable !== 'none' && resizable !== 'vertical'
        ? { width: size.width }
        : {}),
      ...(size.height > 0 && resizable !== 'none' && resizable !== 'horizontal'
        ? { height: size.height }
        : {}),
    };

    return (
      <div
        ref={(node) => {
          (panelRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        className={clsx(
          'relative flex flex-col rounded-lg overflow-hidden',
          variantStyles[variant],
          className
        )}
        style={panelStyle}
        {...props}
      >
        {/* Header */}
        {header && (
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--dm-border-primary)] bg-[var(--dm-bg-secondary)]">
            <div className="flex-1">{header}</div>
            {collapsible && (
              <button
                onClick={handleCollapse}
                className="p-1 text-[var(--dm-text-muted)] hover:text-[var(--dm-text-primary)] transition-colors"
              >
                <svg
                  className={clsx('w-4 h-4 transition-transform', collapsed && 'rotate-180')}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {!collapsed && (
          <div className={clsx('flex-1 overflow-auto', paddingStyles[padding])}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-[var(--dm-accent-primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              children
            )}
          </div>
        )}

        {/* Footer */}
        {footer && !collapsed && (
          <div className="px-3 py-2 border-t border-[var(--dm-border-primary)] bg-[var(--dm-bg-secondary)]">
            {footer}
          </div>
        )}

        {/* Resize Handles */}
        {resizable !== 'none' && !collapsed && (
          <>
            {(resizable === 'horizontal' || resizable === 'both') && (
              <div
                className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-[var(--dm-accent-primary)] transition-colors"
                onMouseDown={(e) => handleMouseDown(e, 'h')}
              />
            )}
            {(resizable === 'vertical' || resizable === 'both') && (
              <div
                className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize hover:bg-[var(--dm-accent-primary)] transition-colors"
                onMouseDown={(e) => handleMouseDown(e, 'v')}
              />
            )}
            {resizable === 'both' && (
              <div
                className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize"
                onMouseDown={(e) => handleMouseDown(e, 'both')}
              >
                <svg
                  className="w-3 h-3 text-[var(--dm-text-muted)]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
                </svg>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);

Panel.displayName = 'Panel';

export default Panel;
