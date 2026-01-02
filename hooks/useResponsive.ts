import { useState, useEffect, useCallback, useMemo } from 'react';

// Breakpoint definitions matching design tokens
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export interface UseResponsiveReturn {
  width: number;
  height: number;
  breakpoint: Breakpoint | 'xs';
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
  isAbove: (bp: Breakpoint) => boolean;
  isBelow: (bp: Breakpoint) => boolean;
  isBetween: (min: Breakpoint, max: Breakpoint) => boolean;
  orientation: 'portrait' | 'landscape';
  isTouch: boolean;
}

function getBreakpoint(width: number): Breakpoint | 'xs' {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function useResponsive(): UseResponsiveReturn {
  const [dimensions, setDimensions] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 1024, height: 768 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

  const [isTouch] = useState(isTouchDevice);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      // Debounce resize events
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const { width, height } = dimensions;
  const breakpoint = getBreakpoint(width);

  const isAbove = useCallback(
    (bp: Breakpoint) => width >= BREAKPOINTS[bp],
    [width]
  );

  const isBelow = useCallback(
    (bp: Breakpoint) => width < BREAKPOINTS[bp],
    [width]
  );

  const isBetween = useCallback(
    (min: Breakpoint, max: Breakpoint) =>
      width >= BREAKPOINTS[min] && width < BREAKPOINTS[max],
    [width]
  );

  return useMemo(
    () => ({
      width,
      height,
      breakpoint,
      // Device categories
      isMobile: width < BREAKPOINTS.md,
      isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
      isDesktop: width >= BREAKPOINTS.lg,
      isLargeDesktop: width >= BREAKPOINTS.xl,
      // Exact breakpoints
      isXs: breakpoint === 'xs',
      isSm: breakpoint === 'sm',
      isMd: breakpoint === 'md',
      isLg: breakpoint === 'lg',
      isXl: breakpoint === 'xl',
      is2xl: breakpoint === '2xl',
      // Comparison helpers
      isAbove,
      isBelow,
      isBetween,
      // Orientation
      orientation: width > height ? 'landscape' : 'portrait',
      isTouch,
    }),
    [width, height, breakpoint, isAbove, isBelow, isBetween, isTouch]
  );
}

// Media query hook for specific queries
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Set initial value
    setMatches(mediaQuery.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

// Breakpoint-specific hooks
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);
}

export function useIsTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`
  );
}

export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
}

// Orientation hook
export function useOrientation(): 'portrait' | 'landscape' {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  return isPortrait ? 'portrait' : 'landscape';
}

// Reduced motion preference
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

// High contrast preference
export function usePrefersHighContrast(): boolean {
  return useMediaQuery('(prefers-contrast: high)');
}

// Container query simulation (for components)
export interface UseContainerQueryOptions {
  ref: React.RefObject<HTMLElement>;
  breakpoints?: Record<string, number>;
}

export function useContainerQuery(options: UseContainerQueryOptions): {
  width: number;
  height: number;
  breakpoint: string;
} {
  const { ref, breakpoints = { sm: 300, md: 500, lg: 700 } } = options;
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  const breakpoint = useMemo(() => {
    const sortedBreakpoints = Object.entries(breakpoints).sort(
      ([, a], [, b]) => b - a
    );
    for (const [name, minWidth] of sortedBreakpoints) {
      if (size.width >= minWidth) return name;
    }
    return 'xs';
  }, [size.width, breakpoints]);

  return { ...size, breakpoint };
}

export default useResponsive;
