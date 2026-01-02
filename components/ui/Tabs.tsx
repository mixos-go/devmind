import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

// Types
export type TabsVariant = 'default' | 'pills' | 'underline' | 'enclosed';
export type TabsSize = 'sm' | 'md' | 'lg';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  variant: TabsVariant;
  size: TabsSize;
  registerTab: (id: string) => void;
  unregisterTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tabs components must be used within a Tabs provider');
  return context;
};

// Tabs Root
export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  size?: TabsSize;
  className?: string;
  children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  variant = 'default',
  size = 'md',
  className,
  children,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const activeTab = value ?? internalValue;
  const tabsRef = useRef<Set<string>>(new Set());

  const setActiveTab = useCallback(
    (id: string) => {
      setInternalValue(id);
      onValueChange?.(id);
    },
    [onValueChange]
  );

  const registerTab = useCallback((id: string) => {
    tabsRef.current.add(id);
    if (!activeTab && tabsRef.current.size === 1) {
      setInternalValue(id);
    }
  }, [activeTab]);

  const unregisterTab = useCallback((id: string) => {
    tabsRef.current.delete(id);
  }, []);

  return (
    <TabsContext.Provider
      value={{ activeTab, setActiveTab, variant, size, registerTab, unregisterTab }}
    >
      <div className={clsx('flex flex-col', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

// TabsList
export interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

const variantListStyles: Record<TabsVariant, string> = {
  default: 'bg-[var(--dm-bg-secondary)] p-1 rounded-lg gap-1',
  pills: 'gap-2',
  underline: 'border-b border-[var(--dm-border-primary)] gap-0',
  enclosed: 'border-b border-[var(--dm-border-primary)] gap-0',
};

export const TabsList: React.FC<TabsListProps> = ({ className, children }) => {
  const { variant } = useTabsContext();

  return (
    <div
      role="tablist"
      className={clsx('flex items-center', variantListStyles[variant], className)}
    >
      {children}
    </div>
  );
};

// TabsTrigger
export interface TabsTriggerProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

const sizeStyles: Record<TabsSize, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

const variantTriggerStyles: Record<TabsVariant, { base: string; active: string; inactive: string }> = {
  default: {
    base: 'rounded-md transition-all duration-150',
    active: 'bg-[var(--dm-bg-primary)] text-[var(--dm-text-primary)] shadow-sm',
    inactive: 'text-[var(--dm-text-secondary)] hover:text-[var(--dm-text-primary)] hover:bg-[var(--dm-bg-hover)]',
  },
  pills: {
    base: 'rounded-full transition-all duration-150',
    active: 'bg-[var(--dm-accent-primary)] text-white',
    inactive: 'text-[var(--dm-text-secondary)] hover:text-[var(--dm-text-primary)] hover:bg-[var(--dm-bg-hover)]',
  },
  underline: {
    base: 'border-b-2 -mb-px transition-all duration-150',
    active: 'border-[var(--dm-accent-primary)] text-[var(--dm-text-primary)]',
    inactive: 'border-transparent text-[var(--dm-text-secondary)] hover:text-[var(--dm-text-primary)] hover:border-[var(--dm-border-secondary)]',
  },
  enclosed: {
    base: 'border border-transparent -mb-px rounded-t-md transition-all duration-150',
    active: 'bg-[var(--dm-bg-primary)] border-[var(--dm-border-primary)] border-b-[var(--dm-bg-primary)] text-[var(--dm-text-primary)]',
    inactive: 'text-[var(--dm-text-secondary)] hover:text-[var(--dm-text-primary)]',
  },
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  disabled = false,
  className,
  children,
}) => {
  const { activeTab, setActiveTab, variant, size, registerTab, unregisterTab } = useTabsContext();
  const isActive = activeTab === value;

  useEffect(() => {
    registerTab(value);
    return () => unregisterTab(value);
  }, [value, registerTab, unregisterTab]);

  const styles = variantTriggerStyles[variant];

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={clsx(
        'font-medium whitespace-nowrap select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dm-ring-color)]',
        sizeStyles[size],
        styles.base,
        isActive ? styles.active : styles.inactive,
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
};

// TabsContent
export interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  forceMount?: boolean;
}

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  className,
  children,
  forceMount = false,
}) => {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === value;

  if (!isActive && !forceMount) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      hidden={!isActive}
      className={clsx(
        'focus-visible:outline-none',
        isActive && 'animate-fade-in',
        className
      )}
    >
      {children}
    </div>
  );
};

// Export all
export default Object.assign(Tabs, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});
