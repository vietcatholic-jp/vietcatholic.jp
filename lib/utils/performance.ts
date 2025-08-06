/**
 * Performance optimization utilities for avatar management system
 * Provides lazy loading, caching, and optimization strategies
 */

import React from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLElement>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [ref as React.RefObject<HTMLElement>, isIntersecting];
}

/**
 * Image preloader hook
 */
export function useImagePreloader(src: string): boolean {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!src) {
      setIsLoaded(false);
      return;
    }

    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setIsLoaded(false);
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return isLoaded;
}

/**
 * Debounced value hook
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttled callback hook
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Memory-efficient image cache
 */
class ImageCache {
  private cache = new Map<string, HTMLImageElement>();
  private maxSize = 50; // Maximum number of cached images

  get(src: string): HTMLImageElement | undefined {
    return this.cache.get(src);
  }

  set(src: string, img: HTMLImageElement): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(src, img);
  }

  has(src: string): boolean {
    return this.cache.has(src);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const imageCache = new ImageCache();

/**
 * Optimized image loader with caching
 */
export function loadImageWithCache(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    // Check cache first
    if (imageCache.has(src)) {
      const cachedImg = imageCache.get(src);
      if (cachedImg) {
        resolve(cachedImg);
        return;
      }
    }

    // Load new image
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Virtual scrolling hook for large lists
 */
export function useVirtualScrolling(
  items: unknown[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTiming(label: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-start`);
    }
  }

  endTiming(label: string): number {
    if (typeof performance === 'undefined') return 0;

    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);

    const measure = performance.getEntriesByName(label)[0];
    const duration = measure.duration;

    // Store metric
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);

    // Clean up marks
    performance.clearMarks(`${label}-start`);
    performance.clearMarks(`${label}-end`);
    performance.clearMeasures(label);

    return duration;
  }

  getAverageTime(label: string): number {
    const times = this.metrics.get(label);
    if (!times || times.length === 0) return 0;

    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  getMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};

    this.metrics.forEach((times, label) => {
      result[label] = {
        average: this.getAverageTime(label),
        count: times.length,
      };
    });

    return result;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

/**
 * Bundle size optimization utilities
 */
export const bundleOptimization = {
  /**
   * Lazy load component with loading fallback
   */
  lazyLoad: <T extends React.ComponentType<Record<string, unknown>>>(
    importFn: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
  ) => {
    const LazyComponent = React.lazy(importFn);

    const LazyWrapper = React.forwardRef<unknown, React.ComponentProps<T>>((props, ref) =>
      React.createElement(React.Suspense,
        { fallback: fallback ? React.createElement(fallback) : null },
        React.createElement(LazyComponent, { ...props, ref } as never)
      )
    );

    LazyWrapper.displayName = `LazyWrapper(${(LazyComponent as { displayName?: string; name?: string }).displayName || (LazyComponent as { displayName?: string; name?: string }).name || 'Component'})`;

    return LazyWrapper;
  },

  /**
   * Preload component for better UX
   */
  preloadComponent: (importFn: () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>) => {
    // Preload on idle
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        importFn();
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        importFn();
      }, 1);
    }
  },
};

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} | null {
  if (typeof performance === 'undefined' || !('memory' in performance)) {
    return null;
  }

  const memory = (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
  return {
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
    percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
  };
}

/**
 * Network status monitoring
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as { connection: { effectiveType: string; addEventListener: (event: string, handler: () => void) => void; removeEventListener: (event: string, handler: () => void) => void } }).connection;
      setConnectionType(connection.effectiveType || 'unknown');

      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown');
      };

      connection.addEventListener('change', handleConnectionChange);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType };
}

/**
 * Adaptive loading based on device capabilities
 */
export function useAdaptiveLoading() {
  const [shouldLoadHighQuality, setShouldLoadHighQuality] = useState(true);

  useEffect(() => {
    // Check device capabilities
    const checkCapabilities = () => {
      let highQuality = true;

      // Check memory
      const memory = getMemoryUsage();
      if (memory && memory.percentage > 80) {
        highQuality = false;
      }

      // Check connection
      if ('connection' in navigator) {
        const connection = (navigator as { connection: { saveData: boolean; effectiveType: string } }).connection;
        if (connection.saveData || connection.effectiveType === 'slow-2g') {
          highQuality = false;
        }
      }

      // Check device pixel ratio
      if (window.devicePixelRatio < 2) {
        highQuality = false;
      }

      setShouldLoadHighQuality(highQuality);
    };

    checkCapabilities();

    // Re-check on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkCapabilities();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { shouldLoadHighQuality };
}

/**
 * React.memo with custom comparison for avatar components
 */
export function createAvatarMemo<T extends React.ComponentType<Record<string, unknown>>>(
  Component: T
): T {
  return React.memo(Component, (prevProps, nextProps) => {
    // Custom comparison for avatar-specific props
    const avatarProps = ['src', 'size', 'editable', 'loading'];
    
    for (const prop of avatarProps) {
      if (prevProps[prop] !== nextProps[prop]) {
        return false;
      }
    }

    return true;
  }) as unknown as T;
}

/**
 * Optimized re-render prevention
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
}