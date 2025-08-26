"use client";

import { useState, useCallback, useRef } from "react";
import { TEAM_MANAGEMENT_ERRORS } from "@/lib/types/team-management";

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

interface UseRetryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  retryCount: number;
}

interface UseRetryReturn<T> extends UseRetryState<T> {
  execute: () => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
}

export function useRetry<T>(
  asyncFunction: () => Promise<T>,
  options: RetryOptions = {}
): UseRetryReturn<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoffMultiplier = 2,
    onRetry,
    onMaxRetriesReached,
  } = options;

  const [state, setState] = useState<UseRetryState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (attempt = 0): Promise<void> => {
    // Cancel previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      retryCount: attempt,
    }));

    try {
      const result = await asyncFunction();
      
      setState(prev => ({
        ...prev,
        data: result,
        loading: false,
        error: null,
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry if request was aborted
      if (err.name === 'AbortError') {
        return;
      }

      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(backoffMultiplier, attempt);
        
        onRetry?.(attempt + 1, err);
        
        setState(prev => ({
          ...prev,
          loading: true,
          error: err,
          retryCount: attempt + 1,
        }));

        setTimeout(() => {
          execute(attempt + 1);
        }, delay);
      } else {
        onMaxRetriesReached?.(err);
        
        setState(prev => ({
          ...prev,
          loading: false,
          error: err,
          retryCount: attempt,
        }));
      }
    }
  }, [asyncFunction, maxRetries, retryDelay, backoffMultiplier, onRetry, onMaxRetriesReached]);

  const retry = useCallback(() => {
    return execute(0);
  }, [execute]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setState({
      data: null,
      loading: false,
      error: null,
      retryCount: 0,
    });
  }, []);

  return {
    ...state,
    execute: () => execute(0),
    retry,
    reset,
  };
}

// Specialized hook for team data fetching
export function useTeamDataWithRetry() {
  const fetchTeamData = useCallback(async () => {
    const response = await fetch('/api/my-team', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(TEAM_MANAGEMENT_ERRORS.UNAUTHORIZED);
      } else if (response.status === 403) {
        throw new Error(TEAM_MANAGEMENT_ERRORS.NOT_TEAM_LEADER);
      } else if (response.status === 404) {
        throw new Error(TEAM_MANAGEMENT_ERRORS.TEAM_NOT_FOUND);
      } else if (response.status >= 500) {
        throw new Error(TEAM_MANAGEMENT_ERRORS.DATABASE_ERROR);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || TEAM_MANAGEMENT_ERRORS.UNKNOWN_ERROR);
    }

    return data.data;
  }, []);

  return useRetry(fetchTeamData, {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 1.5,
    onRetry: (attempt, error) => {
      console.log(`Retrying team data fetch (attempt ${attempt}):`, error.message);
    },
    onMaxRetriesReached: (error) => {
      console.error('Max retries reached for team data fetch:', error);
    },
  });
}

// Hook for handling network errors specifically
export function useNetworkErrorHandler() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const handleNetworkError = useCallback((error: Error) => {
    if (!navigator.onLine) {
      setNetworkError('Không có kết nối internet. Vui lòng kiểm tra kết nối và thử lại.');
      return;
    }

    if (error.message.includes('fetch') || error.message.includes('network')) {
      setNetworkError(TEAM_MANAGEMENT_ERRORS.NETWORK_ERROR);
      return;
    }

    setNetworkError(error.message);
  }, []);

  const clearNetworkError = useCallback(() => {
    setNetworkError(null);
  }, []);

  // Listen for online/offline events
  useState(() => {
    if (typeof window !== 'undefined') {
      const handleOnline = () => {
        setIsOnline(true);
        setNetworkError(null);
      };
      
      const handleOffline = () => {
        setIsOnline(false);
        setNetworkError('Mất kết nối internet');
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  });

  return {
    isOnline,
    networkError,
    handleNetworkError,
    clearNetworkError,
  };
}

// Utility function to determine if an error is retryable
export function isRetryableError(error: Error): boolean {
  // Network errors are retryable
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return true;
  }

  // Server errors (5xx) are retryable
  if (error.message.includes('500') || error.message.includes('502') || 
      error.message.includes('503') || error.message.includes('504')) {
    return true;
  }

  // Timeout errors are retryable
  if (error.message.includes('timeout')) {
    return true;
  }

  // Database errors might be temporary
  if (error.message === TEAM_MANAGEMENT_ERRORS.DATABASE_ERROR) {
    return true;
  }

  // Authorization errors are not retryable
  if (error.message === TEAM_MANAGEMENT_ERRORS.UNAUTHORIZED || 
      error.message === TEAM_MANAGEMENT_ERRORS.NOT_TEAM_LEADER) {
    return false;
  }

  // Not found errors are not retryable
  if (error.message === TEAM_MANAGEMENT_ERRORS.TEAM_NOT_FOUND ||
      error.message === TEAM_MANAGEMENT_ERRORS.MEMBERS_NOT_FOUND) {
    return false;
  }

  // Default to retryable for unknown errors
  return true;
}

// Hook for exponential backoff delay
export function useExponentialBackoff(baseDelay = 1000, maxDelay = 30000) {
  const calculateDelay = useCallback((attempt: number, multiplier = 2) => {
    const delay = baseDelay * Math.pow(multiplier, attempt);
    return Math.min(delay, maxDelay);
  }, [baseDelay, maxDelay]);

  return { calculateDelay };
}
