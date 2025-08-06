/**
 * Responsive utilities for device detection and breakpoint management
 * Supports mobile-first design with touch device detection
 */

import { useState, useEffect } from 'react';

// Breakpoint definitions following mobile-first approach
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  current: Breakpoint;
  width: number;
}

/**
 * Hook to detect current breakpoint and screen size
 * Returns responsive state with current breakpoint information
 */
export function useBreakpoint(): BreakpointState {
  const [breakpointState, setBreakpointState] = useState<BreakpointState>(() => {
    // Server-side rendering fallback - assume mobile
    if (typeof window === 'undefined') {
      return {
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        current: 'mobile',
        width: 0,
      };
    }

    // Client-side initial state
    const width = window.innerWidth;
    return getBreakpointState(width);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      setBreakpointState(getBreakpointState(width));
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return breakpointState;
}

/**
 * Get breakpoint state for a given width
 */
function getBreakpointState(width: number): BreakpointState {
  const isMobile = width < BREAKPOINTS.tablet;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;

  let current: Breakpoint = 'mobile';
  if (isDesktop) current = 'desktop';
  else if (isTablet) current = 'tablet';

  return {
    isMobile,
    isTablet,
    isDesktop,
    current,
    width,
  };
}

/**
 * Hook to detect touch device capabilities
 * Combines multiple detection methods for accuracy
 */
export function useTouchDevice(): {
  isTouch: boolean;
  hasHover: boolean;
  hasPointer: boolean;
  supportsTouch: boolean;
} {
  const [touchState, setTouchState] = useState(() => {
    // Server-side rendering fallback
    if (typeof window === 'undefined') {
      return {
        isTouch: false,
        hasHover: true,
        hasPointer: true,
        supportsTouch: false,
      };
    }

    return detectTouchCapabilities();
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Update touch state on mount
    setTouchState(detectTouchCapabilities());

    // Listen for touch events to detect touch usage
    let touchDetected = false;

    const handleTouchStart = () => {
      if (!touchDetected) {
        touchDetected = true;
        setTouchState(prev => ({ ...prev, isTouch: true }));
      }
    };

    const handleMouseMove = () => {
      if (touchDetected) {
        touchDetected = false;
        setTouchState(prev => ({ ...prev, isTouch: false }));
      }
    };

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return touchState;
}

/**
 * Detect touch capabilities using multiple methods
 */
function detectTouchCapabilities() {
  if (typeof window === 'undefined') {
    return {
      isTouch: false,
      hasHover: true,
      hasPointer: true,
      supportsTouch: false,
    };
  }

  // Check if touch events are supported
  const supportsTouch = 'ontouchstart' in window || 
    navigator.maxTouchPoints > 0 || 
    ((navigator as { msMaxTouchPoints?: number }).msMaxTouchPoints || 0) > 0;

  // Check CSS media queries for hover and pointer capabilities
  const hasHover = window.matchMedia('(hover: hover)').matches;
  const hasPointer = window.matchMedia('(pointer: fine)').matches;

  // Determine if this is primarily a touch device
  const isTouch = supportsTouch && (!hasHover || !hasPointer);

  return {
    isTouch,
    hasHover,
    hasPointer,
    supportsTouch,
  };
}

/**
 * Utility function to get responsive size based on breakpoint
 */
export function getResponsiveSize(
  breakpoint: Breakpoint,
  sizes: {
    mobile: number;
    tablet?: number;
    desktop: number;
  }
): number {
  switch (breakpoint) {
    case 'desktop':
      return sizes.desktop;
    case 'tablet':
      return sizes.tablet ?? sizes.desktop;
    case 'mobile':
    default:
      return sizes.mobile;
  }
}

/**
 * Utility function to check if current breakpoint matches condition
 */
export function matchBreakpoint(
  current: Breakpoint,
  condition: Breakpoint | Breakpoint[]
): boolean {
  if (Array.isArray(condition)) {
    return condition.includes(current);
  }
  return current === condition;
}

/**
 * CSS class helper for responsive styling
 */
export function getResponsiveClasses(
  breakpoint: Breakpoint,
  classes: {
    mobile: string;
    tablet?: string;
    desktop: string;
  }
): string {
  switch (breakpoint) {
    case 'desktop':
      return classes.desktop;
    case 'tablet':
      return classes.tablet ?? classes.desktop;
    case 'mobile':
    default:
      return classes.mobile;
  }
}

/**
 * Hook for responsive values that change based on breakpoint
 */
export function useResponsiveValue<T>(values: {
  mobile: T;
  tablet?: T;
  desktop: T;
}): T {
  const { current } = useBreakpoint();
  
  switch (current) {
    case 'desktop':
      return values.desktop;
    case 'tablet':
      return values.tablet ?? values.desktop;
    case 'mobile':
    default:
      return values.mobile;
  }
}

/**
 * Media query strings for CSS-in-JS solutions
 */
export const MEDIA_QUERIES = {
  mobile: `(max-width: ${BREAKPOINTS.tablet - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.desktop}px)`,
  tabletUp: `(min-width: ${BREAKPOINTS.tablet}px)`,
  desktopUp: `(min-width: ${BREAKPOINTS.desktop}px)`,
} as const;