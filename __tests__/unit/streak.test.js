/**
 * Streak Tracking Unit Tests
 * Tests for daily streak calculation across multiple activity sources, including milestones
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

  // Helper to generate sequential activity dates for streak testing
  function generateSequentialDates(count, startingFrom = 0) {
    const dates = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(Date.now() - (startingFrom + i) * 86400000);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
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

      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('SELECT milestone_days FROM streak_milestones')) {
          return { rows: [] };
        }
        if (sql.includes('FROM readings')) {
          return { rows: [{ activity_date: today }, { activity_date: yesterday }] };
        }
        if (sql.includes('CREATE TABLE')) return { rows: [] };
        return { rows: [] };
      });

      const request = createMockRequest('http://localhost/api/streak?timezone=UTC');
      const response = await GET(request);
      const data = await response.json();

      expect(data.currentStreak).toBe(2);
      expect(data.lastLogin).toBe(today);
      expect(data.milestones).toEqual([]);
      expect(data.newMilestone).toBeNull();
    });

    test('should include task completions in streak', async () => {
      setupAuth(1);
      const today = new Date().toISOString().split('T')[0];

      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('SELECT milestone_days FROM streak_milestones')) return { rows: [] };
        if (sql.includes('FROM readings')) return { rows: [] };
        if (sql.includes('FROM user_tasks')) {
          return { rows: [{ activity_date: today }] };
        }
        if (sql.includes('CREATE TABLE')) return { rows: [] };
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
        if (sql.includes('SELECT milestone_days FROM streak_milestones')) return { rows: [] };
        if (sql.includes('FROM readings')) {
          return { rows: [{ activity_date: today }] };
        }
        if (sql.includes('FROM user_tasks')) {
          return { rows: [{ activity_date: yesterday }] };
        }
        if (sql.includes('FROM journal_entries')) {
          return { rows: [{ activity_date: twoDaysAgo }] };
        }
        if (sql.includes('CREATE TABLE')) return { rows: [] };
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
        if (sql.includes('SELECT milestone_days FROM streak_milestones')) return { rows: [] };
        if (sql.includes('FROM readings')) {
          return { rows: [{ activity_date: today }] };
        }
        if (sql.includes('FROM user_tasks') || sql.includes('FROM journal_entries')) {
          throw new Error('relation does not exist');
        }
        if (sql.includes('CREATE TABLE')) return { rows: [] };
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
        if (sql.includes('SELECT milestone_days FROM streak_milestones')) return { rows: [] };
        if (sql.includes('FROM readings')) {
          return { rows: [{ activity_date: threeDaysAgo }] };
        }
        if (sql.includes('CREATE TABLE')) return { rows: [] };
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
        if (sql.includes('SELECT milestone_days FROM streak_milestones')) return { rows: [] };
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
        if (sql.includes('CREATE TABLE')) return { rows: [] };
        return { rows: [] };
      });

      const request = createMockRequest('http://localhost/api/streak?timezone=UTC');
      const response = await GET(request);
      const data = await response.json();

      expect(data.currentStreak).toBe(3); // today, yesterday, 2 days ago
      expect(data.longestStreak).toBe(3);
    });
  });

  describe('Streak Milestones', () => {
    test('should not return milestones for streak below 7', async () => {
      setupAuth(1);
      const today = new Date().toISOString().split('T')[0];

      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('FROM readings')) {
          return { rows: [{ activity_date: today }] };
        }
        return { rows: [] };
      });

      const request = createMockRequest('http://localhost/api/streak?timezone=UTC');
      const response = await GET(request);
      const data = await response.json();

      expect(data.currentStreak).toBe(1);
      expect(data.milestones).toEqual([]);
      expect(data.newMilestone).toBeNull();
    });

    test('should detect and award a 7-day milestone', async () => {
      setupAuth(1);
      const dates = generateSequentialDates(7, 0);

      let milestoneQueryCount = 0;
      let insertCount = 0;
      let creditInsertCount = 0;

      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('SELECT milestone_days FROM streak_milestones')) {
          milestoneQueryCount++;
          return { rows: [] };
        }
        if (sql.includes('INSERT INTO streak_milestones')) {
          insertCount++;
          return { rows: [] };
        }
        if (sql.includes('INSERT INTO credits') && sql.includes('ON CONFLICT')) {
          creditInsertCount++;
          return { rows: [] };
        }
        if (sql.includes('FROM readings')) {
          return { rows: dates.map(d => ({ activity_date: d })) };
        }
        if (sql.includes('CREATE TABLE')) return { rows: [] };
        return { rows: [] };
      });

      const request = createMockRequest('http://localhost/api/streak?timezone=UTC');
      const response = await GET(request);
      const data = await response.json();

      expect(data.currentStreak).toBe(7);
      expect(data.milestones.length).toBe(1);
      expect(data.milestones[0].days).toBe(7);
      expect(data.milestones[0].badgeName).toBe("Cosmic Spark");
      expect(data.milestones[0].achieved).toBe(true);
      expect(data.newMilestone).not.toBeNull();
      expect(data.newMilestone.days).toBe(7);
      expect(creditInsertCount).toBe(1);
      expect(insertCount).toBe(1);
    });

    test('should skip already-achieved milestones', async () => {
      setupAuth(1);
      const dates = generateSequentialDates(7, 0);

      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('SELECT milestone_days FROM streak_milestones')) {
          return { rows: [{ milestone_days: 7 }] };
        }
        if (sql.includes('INSERT INTO streak_milestones')) {
          return { rows: [] };
        }
        if (sql.includes('INSERT INTO credits') && sql.includes('ON CONFLICT')) {
          return { rows: [] };
        }
        if (sql.includes('FROM readings')) {
          return { rows: dates.map(d => ({ activity_date: d })) };
        }
        if (sql.includes('CREATE TABLE')) return { rows: [] };
        return { rows: [] };
      });

      const request = createMockRequest('http://localhost/api/streak?timezone=UTC');
      const response = await GET(request);
      const data = await response.json();

      expect(data.currentStreak).toBe(7);
      expect(data.milestones.length).toBe(1);
      expect(data.milestones[0].achieved).toBe(true);
      expect(data.newMilestone).toBeNull();
    });

    test('should award multiple milestones at once for a 30-day streak', async () => {
      setupAuth(1);
      const dates = generateSequentialDates(30, 0);

      let insertCount = 0;
      let creditInsertCount = 0;

      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('SELECT milestone_days FROM streak_milestones')) {
          return { rows: [] };
        }
        if (sql.includes('INSERT INTO streak_milestones')) {
          insertCount++;
          return { rows: [] };
        }
        if (sql.includes('INSERT INTO credits') && sql.includes('ON CONFLICT')) {
          creditInsertCount++;
          return { rows: [] };
        }
        if (sql.includes('FROM readings')) {
          return { rows: dates.map(d => ({ activity_date: d })) };
        }
        if (sql.includes('CREATE TABLE')) return { rows: [] };
        return { rows: [] };
      });

      const request = createMockRequest('http://localhost/api/streak?timezone=UTC');
      const response = await GET(request);
      const data = await response.json();

      expect(data.currentStreak).toBe(30);
      expect(data.milestones.length).toBe(3);
      expect(data.milestones[0].days).toBe(7);
      expect(data.milestones[1].days).toBe(14);
      expect(data.milestones[2].days).toBe(30);
      expect(data.newMilestone).not.toBeNull();
      expect(insertCount).toBe(3);
      expect(creditInsertCount).toBe(3);
    });

    test('should handle milestone table creation failure gracefully', async () => {
      setupAuth(1);
      const dates = generateSequentialDates(7, 0);
      let milestoneQueryAttempted = false;

      pool.query.mockImplementation(async (sql) => {
        if (sql.includes('streak_milestones')) {
          milestoneQueryAttempted = true;
          throw new Error('relation "streak_milestones" does not exist');
        }
        if (sql.includes('FROM readings')) {
          return { rows: dates.map(d => ({ activity_date: d })) };
        }
        return { rows: [] };
      });

      const request = createMockRequest('http://localhost/api/streak?timezone=UTC');
      const response = await GET(request);
      const data = await response.json();

      expect(data.currentStreak).toBe(7);
      expect(milestoneQueryAttempted).toBe(true);
      expect(data.milestones).toEqual([]);
      expect(data.newMilestone).toBeNull();
    });
  });
});
