import React, { useState, useRef, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type TooltipAlign = 'start' | 'center' | 'end';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: TooltipPosition;
  align?: TooltipAlign;
  delay?: number;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  arrow?: boolean;
  maxWidth?: number;
}

const positionStyles: Record<TooltipPosition, string> = {
  top: 'bottom-full mb-2',
  bottom: 'top-full mt-2',
  left: 'right-full mr-2',
  right: 'left-full ml-2',
};

const alignStyles: Record<TooltipPosition, Record<TooltipAlign, string>> = {
  top: {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  },
  bottom: {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  },
  left: {
    start: 'top-0',
    center: 'top-1/2 -translate-y-1/2',
    end: 'bottom-0',
  },
  right: {
    start: 'top-0',
    center: 'top-1/2 -translate-y-1/2',
    end: 'bottom-0',
  },
};

const arrowStyles: Record<TooltipPosition, string> = {
  top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-t-[var(--dm-surface-tooltip)] border-x-transparent border-b-transparent',
  bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-b-[var(--dm-surface-tooltip)] border-x-transparent border-t-transparent',
  left: 'right-0 top-1/2 -translate-y-1/2 translate-x-full border-l-[var(--dm-surface-tooltip)] border-y-transparent border-r-transparent',
  right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-full border-r-[var(--dm-surface-tooltip)] border-y-transparent border-l-transparent',
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  align = 'center',
  delay = 200,
  disabled = false,
  className,
  contentClassName,
  arrow = true,
  maxWidth = 250,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay, disabled]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  // Adjust position if tooltip would overflow viewport
  useEffect(() => {
    if (!isVisible || !tooltipRef.current || !triggerRef.current) return;

    const tooltip = tooltipRef.current.getBoundingClientRect();
    const trigger = triggerRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let newPosition = position;

    if (position === 'top' && trigger.top - tooltip.height < 0) {
      newPosition = 'bottom';
    } else if (position === 'bottom' && trigger.bottom + tooltip.height > viewport.height) {
      newPosition = 'top';
    } else if (position === 'left' && trigger.left - tooltip.width < 0) {
      newPosition = 'right';
    } else if (position === 'right' && trigger.right + tooltip.width > viewport.width) {
      newPosition = 'left';
    }

    if (newPosition !== actualPosition) {
      setActualPosition(newPosition);
    }
  }, [isVisible, position, actualPosition]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={triggerRef}
      className={clsx('relative inline-flex', className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      {isVisible && content && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={clsx(
            'absolute z-[var(--dm-z-tooltip)] pointer-events-none',
            'animate-fade-in',
            positionStyles[actualPosition],
            alignStyles[actualPosition][align]
          )}
          style={{ maxWidth }}
        >
          <div
            className={clsx(
              'px-2 py-1.5 rounded-md shadow-lg',
              'bg-[var(--dm-surface-tooltip)] text-[var(--dm-text-primary)]',
              'text-xs font-medium whitespace-normal',
              contentClassName
            )}
          >
            {content}
            
            {arrow && (
              <div
                className={clsx(
                  'absolute w-0 h-0 border-4',
                  arrowStyles[actualPosition]
                )}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Simple text tooltip shorthand
export const TextTooltip: React.FC<{
  text: string;
  children: React.ReactNode;
  position?: TooltipPosition;
}> = ({ text, children, position = 'top' }) => (
  <Tooltip content={text} position={position}>
    {children}
  </Tooltip>
);

export default Tooltip;
