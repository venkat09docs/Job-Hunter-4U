/**
 * Hook for deduplicated Supabase queries
 * Provides a React Query-like interface with built-in deduplication
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { requestDeduplicator } from '@/utils/requestDeduplication';

interface UseDeduplicatedQueryOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

interface UseDeduplicatedQueryResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useDeduplicatedQuery<T>(
  key: string[],
  queryFn: () => Promise<T>,
  options: UseDeduplicatedQueryOptions = {}
): UseDeduplicatedQueryResult<T> {
  const {
    enabled = true,
    refetchOnMount = true,
    staleTime = 5000,
    cacheTime = 300000 // 5 minutes
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const queryKeyRef = useRef<string>();
  const mountedRef = useRef(true);

  // Generate a stable query key
  const queryKey = JSON.stringify(key);

  const executeQuery = useCallback(async () => {
    if (!enabled || !mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const result = await requestDeduplicator.deduplicate(
        queryFn,
        `query:${queryKey}`,
        'GET',
        null,
        null,
        { ttl: staleTime }
      );

      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [queryKey, queryFn, enabled, staleTime]);

  const refetch = useCallback(async () => {
    // Clear cache for this specific query before refetching
    requestDeduplicator.clearCachePattern(queryKey);
    await executeQuery();
  }, [executeQuery, queryKey]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Only execute if the query key changed or if it's the initial mount
    if (queryKeyRef.current !== queryKey || (refetchOnMount && enabled)) {
      queryKeyRef.current = queryKey;
      executeQuery();
    }
  }, [queryKey, executeQuery, enabled, refetchOnMount]);

  return {
    data,
    error,
    loading,
    refetch
  };
}

/**
 * Hook for deduplicated mutations
 */
interface UseDeduplicatedMutationOptions<TVariables> {
  onSuccess?: (data: any, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: any | undefined, error: Error | null, variables: TVariables) => void;
}

interface UseDeduplicatedMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  data: TData | null;
  error: Error | null;
  loading: boolean;
  reset: () => void;
}

export function useDeduplicatedMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseDeduplicatedMutationOptions<TVariables> = {}
): UseDeduplicatedMutationResult<TData, TVariables> {
  const { onSuccess, onError, onSettled } = options;
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const mutateAsync = useCallback(async (variables: TVariables): Promise<TData> => {
    setLoading(true);
    setError(null);

    try {
      // For mutations, we typically don't want to deduplicate unless they're truly idempotent
      // But we can still use the deduplication system for very rapid successive identical mutations
      const mutationKey = `mutation:${JSON.stringify(variables)}`;
      const result = await requestDeduplicator.deduplicate(
        () => mutationFn(variables),
        mutationKey,
        'POST',
        variables,
        null,
        { ttl: 1000, skipCache: true } // Very short TTL, no caching
      );

      setData(result);
      onSuccess?.(result, variables);
      onSettled?.(result, null, variables);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error, variables);
      onSettled?.(undefined, error, variables);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, onSuccess, onError, onSettled]);

  const mutate = useCallback((variables: TVariables) => {
    mutateAsync(variables).catch(() => {
      // Error handling is done in mutateAsync
    });
    return mutateAsync(variables);
  }, [mutateAsync]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    mutate,
    mutateAsync,
    data,
    error,
    loading,
    reset
  };
}