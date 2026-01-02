import React, { useState, useRef, useCallback, useEffect, createContext, useContext } from 'react';
import { clsx } from 'clsx';

// Types
export type PanelPosition = 'left' | 'right' | 'bottom';

export interface PanelConfig {
  id: string;
  position: PanelPosition;
  defaultSize: number;
  minSize: number;
  maxSize: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface LayoutState {
  panels: Record<string, { size: number; collapsed: boolean }>;
  setPanelSize: (id: string, size: number) => void;
  setPanelCollapsed: (id: string, collapsed: boolean) => void;
  togglePanel: (id: string) => void;
}

const LayoutContext = createContext<LayoutState | null>(null);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) throw new Error('useLayout must be used within WorkbenchLayout');
  return context;
};

// Main Layout Component
export interface WorkbenchLayoutProps {
  children: React.ReactNode;
  className?: string;
  activityBar?: React.ReactNode;
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  bottomPanel?: React.ReactNode;
  statusBar?: React.ReactNode;
  leftPanelConfig?: Partial<PanelConfig>;
  rightPanelConfig?: Partial<PanelConfig>;
  bottomPanelConfig?: Partial<PanelConfig>;
  onLayoutChange?: (state: Record<string, { size: number; collapsed: boolean }>) => void;
}

const defaultPanelConfigs: Record<PanelPosition, PanelConfig> = {
  left: {
    id: 'left',
    position: 'left',
    defaultSize: 260,
    minSize: 200,
    maxSize: 500,
    collapsible: true,
    defaultCollapsed: false,
  },
  right: {
    id: 'right',
    position: 'right',
    defaultSize: 400,
    minSize: 300,
    maxSize: 600,
    collapsible: true,
    defaultCollapsed: false,
  },
  bottom: {
    id: 'bottom',
    position: 'bottom',
    defaultSize: 250,
    minSize: 100,
    maxSize: 500,
    collapsible: true,
    defaultCollapsed: false,
  },
};

export const WorkbenchLayout: React.FC<WorkbenchLayoutProps> = ({
  children,
  className,
  activityBar,
  leftPanel,
  rightPanel,
  bottomPanel,
  statusBar,
  leftPanelConfig,
  rightPanelConfig,
  bottomPanelConfig,
  onLayoutChange,
}) => {
  // Merge configs
  const configs = {
    left: { ...defaultPanelConfigs.left, ...leftPanelConfig },
    right: { ...defaultPanelConfigs.right, ...rightPanelConfig },
    bottom: { ...defaultPanelConfigs.bottom, ...bottomPanelConfig },
  };

  // Panel state
  const [panels, setPanels] = useState<Record<string, { size: number; collapsed: boolean }>>({
    left: { size: configs.left.defaultSize, collapsed: configs.left.defaultCollapsed || false },
    right: { size: configs.right.defaultSize, collapsed: configs.right.defaultCollapsed || false },
    bottom: { size: configs.bottom.defaultSize, collapsed: configs.bottom.defaultCollapsed || false },
  });

  const setPanelSize = useCallback((id: string, size: number) => {
    setPanels((prev) => ({
      ...prev,
      [id]: { ...prev[id], size },
    }));
  }, []);

  const setPanelCollapsed = useCallback((id: string, collapsed: boolean) => {
    setPanels((prev) => ({
      ...prev,
      [id]: { ...prev[id], collapsed },
    }));
  }, []);

  const togglePanel = useCallback((id: string) => {
    setPanels((prev) => ({
      ...prev,
      [id]: { ...prev[id], collapsed: !prev[id].collapsed },
    }));
  }, []);

  // Notify parent of layout changes
  useEffect(() => {
    onLayoutChange?.(panels);
  }, [panels, onLayoutChange]);

  const layoutState: LayoutState = {
    panels,
    setPanelSize,
    setPanelCollapsed,
    togglePanel,
  };

  return (
    <LayoutContext.Provider value={layoutState}>
      <div
        className={clsx(
          'flex flex-col h-screen w-screen overflow-hidden',
          'bg-[var(--dm-bg-primary)] text-[var(--dm-text-primary)]',
          className
        )}
      >
        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Activity Bar */}
          {activityBar && (
            <div className="flex-shrink-0 w-12 bg-[var(--dm-bg-secondary)] border-r border-[var(--dm-border-primary)]">
              {activityBar}
            </div>
          )}

          {/* Left Panel */}
          {leftPanel && !panels.left.collapsed && (
            <ResizablePanel
              position="left"
              size={panels.left.size}
              minSize={configs.left.minSize}
              maxSize={configs.left.maxSize}
              onResize={(size) => setPanelSize('left', size)}
            >
              {leftPanel}
            </ResizablePanel>
          )}

          {/* Center Area (Editor + Bottom Panel) */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Main Editor Area */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {children}
            </div>

            {/* Bottom Panel */}
            {bottomPanel && !panels.bottom.collapsed && (
              <ResizablePanel
                position="bottom"
                size={panels.bottom.size}
                minSize={configs.bottom.minSize}
                maxSize={configs.bottom.maxSize}
                onResize={(size) => setPanelSize('bottom', size)}
              >
                {bottomPanel}
              </ResizablePanel>
            )}
          </div>

          {/* Right Panel */}
          {rightPanel && !panels.right.collapsed && (
            <ResizablePanel
              position="right"
              size={panels.right.size}
              minSize={configs.right.minSize}
              maxSize={configs.right.maxSize}
              onResize={(size) => setPanelSize('right', size)}
            >
              {rightPanel}
            </ResizablePanel>
          )}
        </div>

        {/* Status Bar */}
        {statusBar && (
          <div className="flex-shrink-0 h-[22px] bg-[var(--dm-bg-secondary)] border-t border-[var(--dm-border-primary)]">
            {statusBar}
          </div>
        )}
      </div>
    </LayoutContext.Provider>
  );
};

// Resizable Panel Component
interface ResizablePanelProps {
  children: React.ReactNode;
  position: PanelPosition;
  size: number;
  minSize: number;
  maxSize: number;
  onResize: (size: number) => void;
}

const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  position,
  size,
  minSize,
  maxSize,
  onResize,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const startPos = useRef(0);
  const startSize = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      startPos.current = position === 'bottom' ? e.clientY : e.clientX;
      startSize.current = size;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizing.current) return;

        let delta: number;
        if (position === 'bottom') {
          delta = startPos.current - moveEvent.clientY;
        } else if (position === 'left') {
          delta = moveEvent.clientX - startPos.current;
        } else {
          delta = startPos.current - moveEvent.clientX;
        }

        const newSize = Math.min(maxSize, Math.max(minSize, startSize.current + delta));
        onResize(newSize);
      };

      const handleMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = position === 'bottom' ? 'ns-resize' : 'ew-resize';
      document.body.style.userSelect = 'none';
    },
    [position, size, minSize, maxSize, onResize]
  );

  const isHorizontal = position === 'bottom';
  const resizeHandlePosition = {
    left: 'right-0 top-0 w-1 h-full cursor-ew-resize',
    right: 'left-0 top-0 w-1 h-full cursor-ew-resize',
    bottom: 'top-0 left-0 w-full h-1 cursor-ns-resize',
  };

  const panelStyles = {
    left: { width: size, borderRight: '1px solid var(--dm-border-primary)' },
    right: { width: size, borderLeft: '1px solid var(--dm-border-primary)' },
    bottom: { height: size, borderTop: '1px solid var(--dm-border-primary)' },
  };

  return (
    <div
      ref={panelRef}
      className={clsx(
        'relative flex-shrink-0 overflow-hidden',
        'bg-[var(--dm-bg-secondary)]'
      )}
      style={panelStyles[position]}
    >
      {children}
      
      {/* Resize Handle */}
      <div
        className={clsx(
          'absolute z-10 hover:bg-[var(--dm-accent-primary)] transition-colors',
          resizeHandlePosition[position]
        )}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};

// Panel Header Component
export interface PanelHeaderProps {
  title: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  icon,
  actions,
  onClose,
  className,
}) => (
  <div
    className={clsx(
      'flex items-center justify-between h-9 px-3',
      'bg-[var(--dm-bg-tertiary)] border-b border-[var(--dm-border-primary)]',
      className
    )}
  >
    <div className="flex items-center gap-2">
      {icon && <span className="w-4 h-4 text-[var(--dm-text-muted)]">{icon}</span>}
      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--dm-text-secondary)]">
        {title}
      </span>
    </div>
    <div className="flex items-center gap-1">
      {actions}
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 text-[var(--dm-text-muted)] hover:text-[var(--dm-text-primary)] hover:bg-[var(--dm-bg-hover)] rounded transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  </div>
);

// Panel Content Component
export interface PanelContentProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export const PanelContent: React.FC<PanelContentProps> = ({
  children,
  className,
  padding = false,
}) => (
  <div
    className={clsx(
      'flex-1 overflow-auto',
      padding && 'p-3',
      className
    )}
  >
    {children}
  </div>
);

export default WorkbenchLayout;
