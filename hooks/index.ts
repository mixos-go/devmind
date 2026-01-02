// Hooks barrel export
export { useTheme, ThemeProvider, useThemeContext, ThemeToggle } from './useTheme';
export type { 
  Theme, 
  ResolvedTheme, 
  ThemeConfig, 
  UseThemeReturn,
  ThemeProviderProps,
  ThemeToggleProps 
} from './useTheme';

export { 
  useResponsive, 
  useMediaQuery, 
  useIsMobile, 
  useIsTablet, 
  useIsDesktop,
  useOrientation,
  usePrefersReducedMotion,
  usePrefersHighContrast,
  useContainerQuery,
  BREAKPOINTS 
} from './useResponsive';
export type { 
  UseResponsiveReturn, 
  Breakpoint,
  UseContainerQueryOptions 
} from './useResponsive';
