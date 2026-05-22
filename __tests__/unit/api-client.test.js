const { ApiClient } = require('../../lib/api-client');

function mockJsonResponse(data, status = 200) {
  const body = JSON.stringify(data);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Map([['content-type', 'application/json']]),
    json: async () => data,
    text: async () => body,
  };
}

function mockEmptyResponse(status = 204) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'No Content',
    headers: new Map(),
    json: async () => { throw new Error('No content'); },
    text: async () => '',
  };
}

function mockErrorBodyResponse(message, status = 500) {
  const body = JSON.stringify({ message });
  return {
    ok: false,
    status,
    statusText: 'Error',
    headers: new Map([['content-type', 'application/json']]),
    json: async () => ({ message }),
    text: async () => body,
  };
}

function hangingFetch() {
  return new Promise((resolve, reject) => {
    return;
  });
}

function signalAwareHangingFetch() {
  let aborted = false;
  return (url, init) => {
    return new Promise((resolve, reject) => {
      if (init.signal) {
        if (init.signal.aborted) {
          reject(new DOMException('The operation was aborted', 'AbortError'));
          return;
        }
        init.signal.addEventListener('abort', () => {
          aborted = true;
          reject(new DOMException('The operation was aborted', 'AbortError'));
        }, { once: true });
      }
      if (aborted) return;
    });
  };
}

describe('ApiClient', () => {
  let mockFetch;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic requests', () => {
    test('GET returns parsed JSON', async () => {
      const client = new ApiClient();
      mockFetch.mockResolvedValue(mockJsonResponse({ id: 1, name: 'test' }));

      const result = await client.get('/api/test');
      expect(result).toEqual({ id: 1, name: 'test' });
    });

    test('POST sends JSON body', async () => {
      const client = new ApiClient();
      mockFetch.mockResolvedValue(mockJsonResponse({ success: true }));

      const result = await client.post('/api/data', { key: 'value' });
      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/data',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ key: 'value' }),
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        }),
      );
    });

    test('PUT sends JSON body', async () => {
      const client = new ApiClient();
      mockFetch.mockResolvedValue(mockJsonResponse({ updated: true }));

      const result = await client.put('/api/data/1', { name: 'new' });
      expect(result).toEqual({ updated: true });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/data/1',
        expect.objectContaining({ method: 'PUT' }),
      );
    });

    test('PATCH sends JSON body', async () => {
      const client = new ApiClient();
      mockFetch.mockResolvedValue(mockJsonResponse({ patched: true }));

      const result = await client.patch('/api/data/1', { field: 'val' });
      expect(result).toEqual({ patched: true });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/data/1',
        expect.objectContaining({ method: 'PATCH' }),
      );
    });

    test('DELETE with 204 returns undefined', async () => {
      const client = new ApiClient();
      mockFetch.mockResolvedValue(mockEmptyResponse(204));

      const result = await client.delete('/api/data/1');
      expect(result).toBeUndefined();
    });

    test('DELETE with JSON body returns parsed JSON', async () => {
      const client = new ApiClient();
      mockFetch.mockResolvedValue(mockJsonResponse({ deleted: true }));

      const result = await client.delete('/api/data/1');
      expect(result).toEqual({ deleted: true });
    });

    test('sets correct HTTP methods', async () => {
      const client = new ApiClient();
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      await client.get('/a');
      expect(mockFetch).toHaveBeenLastCalledWith('/a', expect.objectContaining({ method: 'GET' }));

      await client.post('/b');
      expect(mockFetch).toHaveBeenLastCalledWith('/b', expect.objectContaining({ method: 'POST' }));

      await client.put('/c');
      expect(mockFetch).toHaveBeenLastCalledWith('/c', expect.objectContaining({ method: 'PUT' }));

      await client.patch('/d');
      expect(mockFetch).toHaveBeenLastCalledWith('/d', expect.objectContaining({ method: 'PATCH' }));

      await client.delete('/e');
      expect(mockFetch).toHaveBeenLastCalledWith('/e', expect.objectContaining({ method: 'DELETE' }));
    });
  });

  describe('Retry behavior', () => {
    test('retries on 429 then succeeds', async () => {
      const client = new ApiClient({
        retry: { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 5 },
      });
      mockFetch
        .mockResolvedValueOnce(mockJsonResponse({ error: 'Rate limited' }, 429))
        .mockResolvedValueOnce(mockJsonResponse({ success: true }));

      const result = await client.get('/api/test');
      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('retries on 500 then succeeds', async () => {
      const client = new ApiClient({
        retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 5 },
      });
      mockFetch
        .mockResolvedValueOnce(mockJsonResponse({ error: 'Server error' }, 500))
        .mockResolvedValueOnce(mockErrorBodyResponse('Retry', 500))
        .mockResolvedValueOnce(mockJsonResponse({ success: true }));

      const result = await client.get('/api/test');
      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('does not retry on 404', async () => {
      const client = new ApiClient({
        retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 5 },
      });
      mockFetch.mockResolvedValue(mockJsonResponse({ error: 'Not found' }, 404));

      await expect(client.get('/api/test')).rejects.toMatchObject({
        status: 404,
        code: 'CLIENT_ERROR',
        retryable: false,
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('does not retry on 400', async () => {
      const client = new ApiClient({
        retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 5 },
      });
      mockFetch.mockResolvedValue(mockJsonResponse({ error: 'Bad request' }, 400));

      await expect(client.get('/api/test')).rejects.toMatchObject({
        status: 400,
        code: 'CLIENT_ERROR',
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('throws MAX_RETRIES_EXCEEDED when all retries fail', async () => {
      const client = new ApiClient({
        retry: { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 5 },
      });
      mockFetch.mockResolvedValue(mockJsonResponse({ error: 'Server error' }, 500));

      await expect(client.get('/api/test')).rejects.toMatchObject({
        code: 'MAX_RETRIES_EXCEEDED',
      });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('does not retry when options.retry is false', async () => {
      const client = new ApiClient({
        retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 5 },
      });
      mockFetch.mockResolvedValue(mockJsonResponse({ error: 'Server error' }, 500));

      await expect(client.get('/api/test', { retry: false })).rejects.toMatchObject({
        status: 500,
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('extracts message from error response body', async () => {
      const client = new ApiClient({
        retry: { maxRetries: 0, baseDelayMs: 1, maxDelayMs: 5 },
      });
      mockFetch.mockResolvedValue(mockErrorBodyResponse('Custom error message', 400));

      await expect(client.get('/api/test')).rejects.toMatchObject({
        message: 'Custom error message',
        status: 400,
      });
    });

    test('extracts error field from response body', async () => {
      const client = new ApiClient({
        retry: { maxRetries: 0, baseDelayMs: 1, maxDelayMs: 5 },
      });
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable',
        headers: new Map(),
        json: async () => ({ error: 'Validation failed' }),
        text: async () => JSON.stringify({ error: 'Validation failed' }),
      });

      await expect(client.get('/api/test')).rejects.toMatchObject({
        message: 'Validation failed',
      });
    });

    test('falls back to status text when no body message', async () => {
      const client = new ApiClient({
        retry: { maxRetries: 0, baseDelayMs: 1, maxDelayMs: 5 },
      });
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Map(),
        json: async () => { throw new Error('Empty body'); },
        text: async () => '',
      });

      await expect(client.get('/api/test')).rejects.toMatchObject({
        message: 'Request failed with status 500',
      });
    });
  });

  describe('Network errors', () => {
    test('retries on TypeError then succeeds', async () => {
      const client = new ApiClient({
        retry: { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 5 },
      });
      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(mockJsonResponse({ success: true }));

      const result = await client.get('/api/test');
      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('throws NETWORK_ERROR after all retries exhausted', async () => {
      const client = new ApiClient({
        retry: { maxRetries: 1, baseDelayMs: 1, maxDelayMs: 5 },
      });
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(client.get('/api/test')).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
      });
    });
  });

  describe('Timeout handling', () => {
    test('thrown timeout error when request hangs', async () => {
      mockFetch.mockImplementation(signalAwareHangingFetch());

      const client = new ApiClient({
        timeout: 50,
        retry: { maxRetries: 0, baseDelayMs: 1, maxDelayMs: 5 },
      });

      await expect(client.get('/api/test')).rejects.toMatchObject({
        code: 'TIMEOUT',
      });
    }, 5000);

    test('retries on timeout then succeeds', async () => {
      let callCount = 0;
      mockFetch.mockImplementation((url, init) => {
        callCount++;
        return new Promise((resolve, reject) => {
          if (init.signal) {
            if (callCount === 1) {
              init.signal.addEventListener('abort', () => {
                reject(new DOMException('The operation was aborted', 'AbortError'));
              }, { once: true });
            } else {
              resolve(mockJsonResponse({ success: true }));
            }
          }
        });
      });

      const client = new ApiClient({
        timeout: 50,
        retry: { maxRetries: 1, baseDelayMs: 1, maxDelayMs: 5 },
      });

      const result = await client.get('/api/test');
      expect(result).toEqual({ success: true });
      expect(callCount).toBe(2);
    }, 5000);
  });

  describe('User cancellation', () => {
    test('throws on pre-aborted signal without retry', async () => {
      const client = new ApiClient({
        retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 5 },
      });
      const controller = new AbortController();
      controller.abort();

      await expect(
        client.get('/api/test', { signal: controller.signal }),
      ).rejects.toMatchObject({
        code: 'TIMEOUT',
        message: 'Request was cancelled',
        retryable: false,
      });
    });

    test('does not retry when user cancels mid-flight', async () => {
      mockFetch.mockImplementation(signalAwareHangingFetch());

      const client = new ApiClient({
        timeout: 5000,
        retry: { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 5 },
      });
      const controller = new AbortController();

      const promise = client.get('/api/test', { signal: controller.signal });
      controller.abort();

      await expect(promise).rejects.toMatchObject({
        code: 'TIMEOUT',
        message: 'Request was cancelled',
        retryable: false,
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('URL handling', () => {
    test('prepends baseUrl to relative paths', async () => {
      const client = new ApiClient({ baseUrl: 'https://api.example.com' });
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      await client.get('/v1/users');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/users',
        expect.any(Object),
      );
    });

    test('uses absolute URL without baseUrl', async () => {
      const client = new ApiClient({ baseUrl: 'https://api.example.com' });
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      await client.get('https://other.com/api/resource');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://other.com/api/resource',
        expect.any(Object),
      );
    });

    test('works without baseUrl', async () => {
      const client = new ApiClient();
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      await client.get('/api/test');
      expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.any(Object));
    });
  });

  describe('Headers', () => {
    test('merges request headers with config headers', async () => {
      const client = new ApiClient({
        headers: { 'X-API-Key': 'abc123' },
      });
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      await client.get('/api/test', {
        headers: { Authorization: 'Bearer token' },
      });

      const { headers: calledHeaders } = mockFetch.mock.calls[0][1];
      expect(calledHeaders['X-API-Key']).toBe('abc123');
      expect(calledHeaders['Authorization']).toBe('Bearer token');
    });

    test('request headers override config headers', async () => {
      const client = new ApiClient({
        headers: { Accept: 'text/plain' },
      });
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      await client.get('/api/test', {
        headers: { Accept: 'application/json' },
      });

      const { headers: calledHeaders } = mockFetch.mock.calls[0][1];
      expect(calledHeaders['Accept']).toBe('application/json');
    });

    test('config headers are set on every request', async () => {
      const client = new ApiClient({
        headers: { 'X-App-Version': '1.0' },
      });
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      await client.get('/a');
      await client.post('/b');

      const { headers: h1 } = mockFetch.mock.calls[0][1];
      const { headers: h2 } = mockFetch.mock.calls[1][1];
      expect(h1['X-App-Version']).toBe('1.0');
      expect(h2['X-App-Version']).toBe('1.0');
    });
  });

  describe('Body serialization', () => {
    test('FormData body does not set Content-Type', async () => {
      const client = new ApiClient();
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      const formData = new FormData();
      formData.append('field', 'value');
      await client.post('/api/upload', formData);

      const call = mockFetch.mock.calls[0][1];
      expect(call.body).toBe(formData);
      expect(call.headers['Content-Type']).toBeUndefined();
    });
  });

  describe('Credentials', () => {
    test('defaults to same-origin', async () => {
      const client = new ApiClient();
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      await client.get('/api/test');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({ credentials: 'same-origin' }),
      );
    });

    test('respects custom credentials config', async () => {
      const client = new ApiClient({ credentials: 'include' });
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      await client.get('/api/test');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({ credentials: 'include' }),
      );
    });
  });

  describe('Empty response handling', () => {
    test('returns undefined for empty 200 response', async () => {
      const client = new ApiClient();
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        json: async () => { throw new Error('Empty body'); },
        text: async () => '',
      });

      const result = await client.get('/api/empty');
      expect(result).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    test('handles POST with undefined body', async () => {
      const client = new ApiClient();
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      await client.post('/api/action');
      const call = mockFetch.mock.calls[0][1];
      expect(call.body).toBeUndefined();
    });

    test('handles trailing slash in path', async () => {
      const client = new ApiClient({ baseUrl: 'https://api.example.com' });
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      await client.get('/v1/users/');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/users/',
        expect.any(Object),
      );
    });
  });
});
