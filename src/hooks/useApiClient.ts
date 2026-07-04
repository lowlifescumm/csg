'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ApiClient, ApiError } from '../../lib/api-client';

export interface UseApiClientOptions {
  enabled?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (error: ApiError) => void;
}

export interface UseApiClientResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useApiClient<T>(
  client: ApiClient,
  fetcher: (client: ApiClient) => Promise<T>,
  deps: unknown[] = [],
  options: UseApiClientOptions = {},
): UseApiClientResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const depsRef = useRef(deps);
  depsRef.current = deps;

  const execute = useCallback(() => {
    setLoading(true);
    setError(null);

    fetcherRef
      .current(client)
      .then((result) => {
        if (mountedRef.current) {
          setData(result);
          options.onSuccess?.(result);
        }
      })
      .catch((err: ApiError) => {
        if (mountedRef.current) {
          setError(err);
          options.onError?.(err);
        }
      })
      .finally(() => {
        if (mountedRef.current) {
          setLoading(false);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, ...deps]);

  useEffect(() => {
    mountedRef.current = true;

    if (options.enabled !== false) {
      execute();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [execute, options.enabled]);

  return { data, loading, error, refetch: execute };
}
