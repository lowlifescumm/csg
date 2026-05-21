/**
 * Streak Tracking Unit Tests
 * Tests for daily streak calculation across multiple activity sources
 */

// Mock Next.js server dependencies
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data, init = {}) => ({
      status: init.status || 200,
      json: async () => data,
    }),
  },
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const { cookies } = require('next/headers');
const { verifyToken } = require('@/lib/auth');
const { pool } = require('@/lib/db');
const { GET } = require('@/app/api/streak/route');

describe('Streak Tracking API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createMockRequest(url) {
    return { url };
  }

  function setupAuth(userId = 1) {
    cookies.mockResolvedValue({
      get: (name) => (name === 'auth_token' ? { value: 'valid-token' } : undefined),
    });
    verifyToken.mockReturnValue({ userId });
  }

  describe('Authentication', () => {
    test('should return 401 when no auth token', async () => {
      cookies.mockResolvedValue({
        get: () => undefined,
      });

      const request = createMockRequest('http://localhost/api/streak');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    test('should return 401 when token is invalid', async () => {
      cookies.mockResolvedValue({
        get: (name) => (name === 'auth_token' ? { value: 'bad-token' } : undefined),
      });
      verifyToken.mockReturnValue(null);

      const request = createMockRequest('http://localhost/api/streak');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Streak calculation from multiple sources', () => {
    test('should calculate streak from readings only', async () => {
      setupAuth(1);
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Mock all table queries — only readings returns data
      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('FROM readings')) {
          return { rows: [{ activity_date: today }, { activity_date: yesterday }] };
        }
        return { rows: [] };
      });

      const request = createMockRequest('http://localhost/api/streak?timezone=UTC');
      const response = await GET(request);
      const data = await response.json();

      expect(data.currentStreak).toBe(2);
      expect(data.lastLogin).toBe(today);
    });

    test('should include task completions in streak', async () => {
      setupAuth(1);
      const today = new Date().toISOString().split('T')[0];

      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('FROM readings')) return { rows: [] };
        if (sql.includes('FROM user_tasks')) {
          return { rows: [{ activity_date: today }] };
        }
        return { rows: [] };
      });

      const request = createMockRequest('http://localhost/api/streak?timezone=UTC');
      const response = await GET(request);
      const data = await response.json();

      expect(data.currentStreak).toBe(1);
      expect(data.lastLogin).toBe(today);
    });

    test('should merge dates from multiple tables', async () => {
      setupAuth(1);
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('FROM readings')) {
          return { rows: [{ activity_date: today }] };
        }
        if (sql.includes('FROM user_tasks')) {
          return { rows: [{ activity_date: yesterday }] };
        }
        if (sql.includes('FROM journal_entries')) {
          return { rows: [{ activity_date: twoDaysAgo }] };
        }
        return { rows: [] };
      });

      const request = createMockRequest('http://localhost/api/streak?timezone=UTC');
      const response = await GET(request);
      const data = await response.json();

      expect(data.currentStreak).toBe(3);
    });

    test('should handle missing tables gracefully', async () => {
      setupAuth(1);
      const today = new Date().toISOString().split('T')[0];

      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('FROM readings')) {
          return { rows: [{ activity_date: today }] };
        }
        if (sql.includes('FROM user_tasks') || sql.includes('FROM journal_entries')) {
          throw new Error('relation does not exist');
        }
        return { rows: [] };
      });

      const request = createMockRequest('http://localhost/api/streak?timezone=UTC');
      const response = await GET(request);
      const data = await response.json();

      expect(data.currentStreak).toBe(1);
    });

    test('should return 0 streak when no activity at all', async () => {
      setupAuth(1);

      pool.query.mockResolvedValue({ rows: [] });

      const request = createMockRequest('http://localhost/api/streak?timezone=UTC');
      const response = await GET(request);
      const data = await response.json();

      expect(data.currentStreak).toBe(0);
      expect(data.longestStreak).toBe(0);
    });

    test('should reset streak when gap is more than 1 day', async () => {
      setupAuth(1);
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];

      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('FROM readings')) {
          return { rows: [{ activity_date: threeDaysAgo }] };
        }
        return { rows: [] };
      });

      const request = createMockRequest('http://localhost/api/streak?timezone=UTC');
      const response = await GET(request);
      const data = await response.json();

      expect(data.currentStreak).toBe(0);
      expect(data.lastLogin).toBe(threeDaysAgo);
    });

    test('should calculate longest streak correctly', async () => {
      setupAuth(1);
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
      const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];
      const sixDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];

      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('FROM readings')) {
          return {
            rows: [
              { activity_date: today },
              { activity_date: yesterday },
              { activity_date: twoDaysAgo },
              { activity_date: fiveDaysAgo },
              { activity_date: sixDaysAgo },
            ],
          };
        }
        return { rows: [] };
      });

      const request = createMockRequest('http://localhost/api/streak?timezone=UTC');
      const response = await GET(request);
      const data = await response.json();

      expect(data.currentStreak).toBe(3); // today, yesterday, 2 days ago
      expect(data.longestStreak).toBe(3);
    });
  });
});
