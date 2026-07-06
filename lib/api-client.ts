export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retry?: RetryConfig;
  credentials?: RequestCredentials;
}

export interface RequestOptions {
  timeout?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  retry?: boolean;
  cache?: RequestCache;
}

export type ApiErrorCode =
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'MAX_RETRIES_EXCEEDED'
  | 'CLIENT_ERROR'
  | 'SERVER_ERROR';

export interface ApiError {
  status?: number;
  message: string;
  code: ApiErrorCode;
  retryable: boolean;
}

interface InternalError {
  status?: number;
  message: string;
  retryable: boolean;
}

const DEFAULT_CONFIG: Required<ApiClientConfig> = {
  baseUrl: '',
  timeout: 15_000,
  headers: {},
  retry: { maxRetries: 3, baseDelayMs: 1_000, maxDelayMs: 10_000 },
  credentials: 'same-origin',
};

export class ApiClient {
  private config: Required<ApiClientConfig>;

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl ?? DEFAULT_CONFIG.baseUrl,
      timeout: config.timeout ?? DEFAULT_CONFIG.timeout,
      headers: config.headers ?? { ...DEFAULT_CONFIG.headers },
      retry: config.retry ?? { ...DEFAULT_CONFIG.retry },
      credentials: config.credentials ?? DEFAULT_CONFIG.credentials,
    };
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, options);
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, body, options);
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const url = path.startsWith('http') ? path : `${this.config.baseUrl}${path}`;
    const timeout = options?.timeout ?? this.config.timeout;
    const shouldRetry = options?.retry ?? true;
    const { retry: retryConfig } = this.config;
    const maxRetries = shouldRetry ? retryConfig.maxRetries : 0;

    const headers: Record<string, string> = {
      ...this.config.headers,
      ...options?.headers,
    };

    const bodyInit = this.serializeBody(body, headers);

    let lastError: InternalError | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), timeout);

      try {
        if (options?.signal?.aborted) {
          clearTimeout(timeoutId);
          throw {
            message: 'Request was cancelled',
            code: 'TIMEOUT' as const,
            retryable: false,
          } as ApiError;
        }

        const mergedSignal = this.mergeSignals(options?.signal, timeoutController.signal);

        const response = await fetch(url, {
          method,
          headers,
          body: bodyInit,
          credentials: this.config.credentials,
          signal: mergedSignal,
          cache: options?.cache ?? 'no-store',
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await this.tryParseJson(response);
          const message =
            (errorBody?.message as string) ||
            (errorBody?.error as string) ||
            `Request failed with status ${response.status}`;

          if (this.isRetryable(response.status)) {
            if (attempt < maxRetries) {
              lastError = { status: response.status, message, retryable: true };
              await this.sleep(this.calculateDelay(attempt, retryConfig));
              continue;
            }
            throw {
              status: response.status,
              message,
              code: 'MAX_RETRIES_EXCEEDED' as const,
              retryable: false,
            } as ApiError;
          }

          throw this.toApiError(response.status, message);
        }

        if (response.status === 204) {
          return undefined as T;
        }

        const text = await response.text();
        if (!text) return undefined as T;
        return JSON.parse(text) as T;
      } catch (err) {
        clearTimeout(timeoutId);

        if (this.isApiError(err)) {
          throw err;
        }

        if (err instanceof DOMException && err.name === 'AbortError') {
          const wasTimeout = timeoutController.signal.aborted;

          if (!wasTimeout) {
            throw {
              message: 'Request was cancelled',
              code: 'TIMEOUT',
              retryable: false,
            } as ApiError;
          }

          if (attempt < maxRetries) {
            lastError = { message: `Request timed out after ${timeout}ms`, retryable: true };
            await this.sleep(this.calculateDelay(attempt, retryConfig));
            continue;
          }
          throw {
            message: `Request timed out after ${timeout}ms`,
            code: 'TIMEOUT',
            retryable: false,
          } as ApiError;
        }

        if (err instanceof TypeError) {
          if (attempt < maxRetries) {
            lastError = { message: err.message, retryable: true };
            await this.sleep(this.calculateDelay(attempt, retryConfig));
            continue;
          }
          throw {
            message: err.message,
            code: 'NETWORK_ERROR',
            retryable: false,
          } as ApiError;
        }

        if (attempt < maxRetries) {
          lastError = { message: (err as Error).message, retryable: true };
          await this.sleep(this.calculateDelay(attempt, retryConfig));
          continue;
        }

        throw {
          message: (err as Error).message || 'Unknown request error',
          code: 'NETWORK_ERROR',
          retryable: false,
        } as ApiError;
      }
    }

    throw {
      status: lastError?.status,
      message: lastError?.message || 'Request failed after all retries',
      code: 'MAX_RETRIES_EXCEEDED',
      retryable: false,
    } as ApiError;
  }

  private serializeBody(
    body: unknown,
    headers: Record<string, string>,
  ): BodyInit | undefined {
    if (body === undefined) return undefined;
    if (body instanceof FormData) return body;
    if (body instanceof URLSearchParams) {
      headers['Content-Type'] ??= 'application/x-www-form-urlencoded;charset=UTF-8';
      return body;
    }
    headers['Content-Type'] ??= 'application/json';
    return JSON.stringify(body);
  }

  private isRetryable(status: number): boolean {
    return status === 429 || status >= 500;
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
    const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
    const jitter = Math.random() * 0.3 * cappedDelay;
    return Math.round(cappedDelay + jitter);
  }

  private mergeSignals(
    ...signals: (AbortSignal | undefined)[]
  ): AbortSignal | undefined {
    const active = signals.filter((s): s is AbortSignal => s !== undefined);
    if (active.length === 0) return undefined;
    if (active.length === 1) return active[0];
    const controller = new AbortController();
    for (const signal of active) {
      if (signal.aborted) {
        controller.abort(signal.reason);
        return controller.signal;
      }
      signal.addEventListener(
        'abort',
        () => controller.abort(signal.reason),
        { once: true },
      );
    }
    return controller.signal;
  }

  private async tryParseJson(
    response: Response,
  ): Promise<Record<string, unknown> | null> {
    try {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  }

  private toApiError(status: number, message: string): ApiError {
    return {
      status,
      message,
      code: status >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR',
      retryable: this.isRetryable(status),
    };
  }

  private isApiError(err: unknown): err is ApiError {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      'message' in err &&
      'retryable' in err
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
// Singleton apiClient instance for use with hooks
export const apiClient = new ApiClient();
