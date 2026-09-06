import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-error';

/**
 * Retry transient failures (network blips, 5xx) with exponential backoff —
 * important on Ghana's variable mobile bandwidth — but never retry a request
 * the server rejected on its merits (4xx).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          if (error.isNetwork) return failureCount < 3;
          if (error.status >= 500) return failureCount < 2;
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
    mutations: {
      retry: (failureCount, error) =>
        error instanceof ApiError && error.isNetwork && failureCount < 2,
    },
  },
});

export const queryKeys = {
  session: ['session'] as const,
  listings: {
    all: ['listings'] as const,
    browse: (filters: Record<string, unknown>) =>
      ['listings', 'browse', filters] as const,
    detail: (id: string) => ['listings', 'detail', id] as const,
    mine: (filters: Record<string, unknown>) =>
      ['listings', 'mine', filters] as const,
  },
} as const;
