import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

// Types
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
  children?: ContextMenuItem[];
}

export interface ContextMenuSeparator {
  type: 'separator';
}

export type ContextMenuItemOrSeparator = ContextMenuItem | ContextMenuSeparator;

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  items: ContextMenuItemOrSeparator[];
}

interface ContextMenuContextValue {
  state: ContextMenuState;
  open: (position: { x: number; y: number }, items: ContextMenuItemOrSeparator[]) => void;
  close: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

export const useContextMenu = () => {
  const context = useContext(ContextMenuContext);
  if (!context) throw new Error('useContextMenu must be used within a ContextMenuProvider');
  return context;
};

// Provider
export interface ContextMenuProviderProps {
  children: React.ReactNode;
}

export const ContextMenuProvider: React.FC<ContextMenuProviderProps> = ({ children }) => {
  const [state, setState] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    items: [],
  });

  const open = useCallback((position: { x: number; y: number }, items: ContextMenuItemOrSeparator[]) => {
    // Adjust position to keep menu in viewport
    const menuWidth = 200;
    const menuHeight = items.length * 36;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const adjustedPosition = {
      x: Math.min(position.x, viewport.width - menuWidth - 10),
      y: Math.min(position.y, viewport.height - menuHeight - 10),
    };

    setState({
      isOpen: true,
      position: adjustedPosition,
      items,
    });
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Close on click outside or escape
  useEffect(() => {
    if (!state.isOpen) return;

    const handleClick = () => close();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.isOpen, close]);

  return (
    <ContextMenuContext.Provider value={{ state, open, close }}>
      {children}
      {state.isOpen && (
        <ContextMenuPortal
          position={state.position}
          items={state.items}
          onClose={close}
        />
      )}
    </ContextMenuContext.Provider>
  );
};

// Portal Component
interface ContextMenuPortalProps {
  position: { x: number; y: number };
  items: ContextMenuItemOrSeparator[];
  onClose: () => void;
}

const ContextMenuPortal: React.FC<ContextMenuPortalProps> = ({
  position,
  items,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  return (
    <div
      ref={menuRef}
      className={clsx(
        'fixed z-[var(--dm-z-popover)] min-w-[180px] py-1',
        'bg-[var(--dm-surface-dropdown)] border border-[var(--dm-border-primary)]',
        'rounded-lg shadow-xl',
        'animate-scale-in origin-top-left'
      )}
      style={{ left: position.x, top: position.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => {
        if ('type' in item && item.type === 'separator') {
          return (
            <div
              key={`sep-${index}`}
              className="my-1 h-px bg-[var(--dm-border-primary)]"
            />
          );
        }

        const menuItem = item as ContextMenuItem;
        const hasSubmenu = menuItem.children && menuItem.children.length > 0;

        return (
          <div
            key={menuItem.id}
            className="relative"
            onMouseEnter={() => hasSubmenu && setActiveSubmenu(menuItem.id)}
            onMouseLeave={() => hasSubmenu && setActiveSubmenu(null)}
          >
            <button
              disabled={menuItem.disabled}
              onClick={() => {
                if (!hasSubmenu && menuItem.onClick) {
                  menuItem.onClick();
                  onClose();
                }
              }}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2 text-sm',
                'transition-colors duration-100',
                menuItem.disabled
                  ? 'text-[var(--dm-text-disabled)] cursor-not-allowed'
                  : menuItem.danger
                  ? 'text-[var(--dm-error)] hover:bg-[var(--dm-error-bg)]'
                  : 'text-[var(--dm-text-primary)] hover:bg-[var(--dm-bg-hover)]'
              )}
            >
              {menuItem.icon && (
                <span className="w-4 h-4 flex-shrink-0">{menuItem.icon}</span>
              )}
              <span className="flex-1 text-left">{menuItem.label}</span>
              {menuItem.shortcut && (
                <span className="text-xs text-[var(--dm-text-muted)] ml-4">
                  {menuItem.shortcut}
                </span>
              )}
              {hasSubmenu && (
                <svg
                  className="w-4 h-4 text-[var(--dm-text-muted)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              )}
            </button>

            {/* Submenu */}
            {hasSubmenu && activeSubmenu === menuItem.id && (
              <div
                className={clsx(
                  'absolute left-full top-0 ml-1 min-w-[160px] py-1',
                  'bg-[var(--dm-surface-dropdown)] border border-[var(--dm-border-primary)]',
                  'rounded-lg shadow-xl',
                  'animate-fade-in'
                )}
              >
                {menuItem.children!.map((subItem) => (
                  <button
                    key={subItem.id}
                    disabled={subItem.disabled}
                    onClick={() => {
                      if (subItem.onClick) {
                        subItem.onClick();
                        onClose();
                      }
                    }}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2 text-sm',
                      'transition-colors duration-100',
                      subItem.disabled
                        ? 'text-[var(--dm-text-disabled)] cursor-not-allowed'
                        : subItem.danger
                        ? 'text-[var(--dm-error)] hover:bg-[var(--dm-error-bg)]'
                        : 'text-[var(--dm-text-primary)] hover:bg-[var(--dm-bg-hover)]'
                    )}
                  >
                    {subItem.icon && (
                      <span className="w-4 h-4 flex-shrink-0">{subItem.icon}</span>
                    )}
                    <span className="flex-1 text-left">{subItem.label}</span>
                    {subItem.shortcut && (
                      <span className="text-xs text-[var(--dm-text-muted)]">
                        {subItem.shortcut}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Trigger Component
export interface ContextMenuTriggerProps {
  children: React.ReactNode;
  items: ContextMenuItemOrSeparator[];
  disabled?: boolean;
  className?: string;
}

export const ContextMenuTrigger: React.FC<ContextMenuTriggerProps> = ({
  children,
  items,
  disabled = false,
  className,
}) => {
  const { open } = useContextMenu();

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      e.preventDefault();
      open({ x: e.clientX, y: e.clientY }, items);
    },
    [disabled, items, open]
  );

  return (
    <div className={className} onContextMenu={handleContextMenu}>
      {children}
    </div>
  );
};

// Helper to create menu items
export const createMenuItem = (
  id: string,
  label: string,
  options?: Partial<Omit<ContextMenuItem, 'id' | 'label'>>
): ContextMenuItem => ({
  id,
  label,
  ...options,
});

export const createSeparator = (): ContextMenuSeparator => ({
  type: 'separator',
});

export default ContextMenuProvider;
