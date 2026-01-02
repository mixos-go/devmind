import { useState, useEffect, useCallback, useMemo } from 'react';

export type Theme = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

export interface ThemeConfig {
  storageKey?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  attribute?: 'class' | 'data-theme';
}

export interface UseThemeReturn {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
  systemTheme: ResolvedTheme;
}

const STORAGE_KEY = 'devmind-theme';
const DEFAULT_THEME: Theme = 'dark';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(storageKey: string): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === 'dark' || stored === 'light' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  return null;
}

function applyTheme(theme: ResolvedTheme, attribute: 'class' | 'data-theme') {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  if (attribute === 'class') {
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
  } else {
    root.setAttribute('data-theme', theme);
  }
  
  // Also set color-scheme for native elements
  root.style.colorScheme = theme;
}

export function useTheme(config: ThemeConfig = {}): UseThemeReturn {
  const {
    storageKey = STORAGE_KEY,
    defaultTheme = DEFAULT_THEME,
    enableSystem = true,
    attribute = 'data-theme',
  } = config;

  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredTheme(storageKey);
    return stored || defaultTheme;
  });

  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  // Resolve the actual theme to apply
  const resolvedTheme = useMemo<ResolvedTheme>(() => {
    if (theme === 'system') {
      return systemTheme;
    }
    return theme;
  }, [theme, systemTheme]);

  // Apply theme to document
  useEffect(() => {
    applyTheme(resolvedTheme, attribute);
  }, [resolvedTheme, attribute]);

  // Listen for system theme changes
  useEffect(() => {
    if (!enableSystem) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [enableSystem]);

  // Set theme with persistence
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch {
      // localStorage not available
    }
  }, [storageKey]);

  // Toggle between dark and light (skips system)
  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: theme === 'system',
    systemTheme,
  };
}

// Theme Provider Context (optional, for global access)
import React, { createContext, useContext } from 'react';

const ThemeContext = createContext<UseThemeReturn | null>(null);

export interface ThemeProviderProps {
  children: React.ReactNode;
  config?: ThemeConfig;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, config }) => {
  const themeValue = useTheme(config);
  
  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = (): UseThemeReturn => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

// Theme Toggle Component
export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  showLabel = false,
  size = 'md',
}) => {
  const { resolvedTheme, toggleTheme, isDark } = useTheme();
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 p-2 rounded-md transition-colors
        hover:bg-[var(--dm-bg-hover)] text-[var(--dm-text-secondary)]
        hover:text-[var(--dm-text-primary)] ${className || ''}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {isDark ? (
        <svg className={sizeClasses[size]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg className={sizeClasses[size]} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
      {showLabel && (
        <span className="text-sm">{isDark ? 'Light' : 'Dark'}</span>
      )}
    </button>
  );
};

export default useTheme;
