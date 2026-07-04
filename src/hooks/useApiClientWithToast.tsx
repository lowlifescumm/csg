'use client';

import { useCallback, useRef } from 'react';
import { useToast } from '@/components/ui';
import type { ApiClient, ApiError, ApiErrorCode } from '@/lib/api-client';
import { useApiClient } from '@/src/hooks/useApiClient';

import type {
  UseApiClientResult,
  UseApiClientOptions,
} from '@/src/hooks/useApiClient';

export const DEFAULT_TOAST_MESSAGE = "Something unexpected happened. Please try again.";

const ERROR_CODE_MESSAGES: Record<ApiErrorCode, string> = {
  TIMEOUT: "The request timed out. Check your connection and try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  SERVER_ERROR: "Something went wrong on our end. Please try again.",
  MAX_RETRIES_EXCEEDED: "We're having trouble reaching our servers. Please try again later.",
  CLIENT_ERROR: "",
};

export interface ToastMessages {
  error?: string;
}

export interface UseApiClientWithToastOptions<T>
  extends UseApiClientOptions {
  toastMessages?: ToastMessages;
  onRetryAction?: () => void;
  onErrorWithToast?: (error: ApiError) => string | false;
}

function defaultErrorMessage(error: ApiError): string {
  if (error.code === 'CLIENT_ERROR') {
    return error.message;
  }
  return ERROR_CODE_MESSAGES[error.code] ?? DEFAULT_TOAST_MESSAGE;
}

export function useApiClientWithToast<T>(
  client: ApiClient,
  fetcher: (client: ApiClient) => Promise<T>,
  deps: unknown[] = [],
  options: UseApiClientWithToastOptions<T> = {},
): UseApiClientResult<T> {
  const toast = useToast();
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const refetchRef = useRef<() => void>(() => {});

  const onError = useCallback(
    (error: ApiError) => {
      if (optionsRef.current.onErrorWithToast) {
        const msg = optionsRef.current.onErrorWithToast(error);
        if (msg === false) return;
        toast.error(msg);
        return;
      }

      const message =
        optionsRef.current.toastMessages?.error ??
        defaultErrorMessage(error);

      toast.error(message, {
        action: {
          label: 'Try Again',
          onClick: () => {
            optionsRef.current.onRetryAction?.();
            refetchRef.current();
          },
        },
        duration: 8000,
      });

      options.onError?.(error);
    },
    [toast],
  );

  const result = useApiClient<T>(client, fetcher, deps, {
    ...options,
    onError,
  });

  refetchRef.current = result.refetch;

  return result;
}
