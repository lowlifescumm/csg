/**
 * Heartbeat Failure Simulation Test
 * 
 * Verifies that the backend automatically sets advisors to `offline` when they haven't
 * sent a heartbeat within 60 seconds, simulating a connection failure scenario.
 * This validates the automatic offline detection mechanism.
 */

const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// Import the route handler directly
const { POST } = require('@/app/api/marketplace/advisors/heartbeat/route');

process.env.JWT_SECRET = 'test-jwt-secret';

// Mock next/headers cookies to avoid request scope issues
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock getAuthenticatedUser to return the test user directly
jest.mock('@/lib/auth', () => {
  const originalModule = jest.requireActual('@/lib/auth');
  return {
    ...originalModule,
    getAuthenticatedUser: jest.fn(),
  };
});

// Mock auth config
jest.mock('@/lib/auth-config', () => ({
  authOptions: {},
}));

// Helper function to check database availability (called at runtime, not module load)
function checkDatabaseAvailability() {
  const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  return !!dbUrl && 
         dbUrl.trim() !== '' &&
         dbUrl.startsWith('postgresql://');
}

describe('Advisor Heartbeat Failure Simulation', () => {
  let pool;
  let advisorUser; // Advisor user
  let advisorEmail; // Store advisor email for mock

  beforeAll(async () => {
    const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
    if (!checkDatabaseAvailability()) {
      console.warn('Skipping database tests: TEST_DATABASE_URL or DATABASE_URL is not set');
      return;
    }

    try {
      pool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl?.includes("localhost") ? false : { rejectUnauthorized: false },
      });
      // Test connection
      await pool.query('SELECT 1');
    } catch (error) {
      console.error('Failed to connect to database:', error.message);
      throw error;
    }
  });

  afterAll(async () => {
    if (!checkDatabaseAvailability() || !pool) {
      return;
    }

    // Comprehensive cleanup of all test data
    if (advisorUser?.id) {
      // Clean up advisor profile
      await pool.query('DELETE FROM advisor_profile WHERE user_id = $1', [advisorUser.id]).catch(() => {});
      // Clean up user
      await pool.query('DELETE FROM users WHERE id = $1', [advisorUser.id]).catch(() => {});
    }

    await pool.end();
  });

  describe('Heartbeat Failure Detection', () => {
    beforeEach(async () => {
      // Clear all mocks before each test
      jest.clearAllMocks();
      
      if (!checkDatabaseAvailability() || !pool) {
        return;
      }

      // Create advisor user
      advisorEmail = `test-advisor-heartbeat-${Date.now()}@example.com`;
      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, created_at)
         VALUES ($1, 'hashed_password', 'Test', 'Advisor', NOW())
         RETURNING id`,
        [advisorEmail]
      );
      advisorUser = userResult.rows[0];

      // Create approved advisor profile, initially set to online
      await pool.query(
        `INSERT INTO advisor_profile (user_id, is_advisor, is_online, per_minute_rate, bio, specialties)
         VALUES ($1, true, true, 5.00, 'Test Advisor', $2::TEXT[])`,
        [advisorUser.id, ['Tarot']]
      );
    });

    afterEach(async () => {
      if (!checkDatabaseAvailability() || !pool) {
        return;
      }

      // Clean up after each test
      if (advisorUser?.id) {
        await pool.query('DELETE FROM advisor_profile WHERE user_id = $1', [advisorUser.id]).catch(() => {});
      }
    });

    test('should automatically set advisor offline when heartbeat not received within 60 seconds', async () => {
      if (!checkDatabaseAvailability() || !pool || !advisorUser) {
        console.log('Skipping test: Database not available');
        return;
      }

      // Generate JWT token for advisor user
      const token = jwt.sign({ userId: advisorUser.id }, process.env.JWT_SECRET);

      // Mock cookies to return a mock cookie store (required by next/headers)
      const { cookies } = require('next/headers');
      const mockCookieStore = {
        get: jest.fn((name) => {
          if (name === 'auth_token') {
            return { value: token };
          }
          return null;
        }),
        getAll: jest.fn(() => {
          return [{ name: 'auth_token', value: token }];
        }),
      };
      cookies.mockResolvedValue(mockCookieStore);

      // Mock getAuthenticatedUser to return the advisor user
      const { getAuthenticatedUser } = require('@/lib/auth');
      getAuthenticatedUser.mockResolvedValue({
        userId: advisorUser.id,
        user: {
          id: advisorUser.id,
          email: advisorEmail,
          firstName: 'Test',
          lastName: 'Advisor',
          role: 'user',
        },
      });

      // Step 1: Send initial heartbeat to establish last_heartbeat_at timestamp
      const initialRequest = new Request('http://localhost/api/marketplace/advisors/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const initialResponse = await POST(initialRequest);
      expect(initialResponse.status).toBe(200);

      // Verify advisor is online and has heartbeat timestamp
      const initialCheck = await pool.query(
        `SELECT is_online, last_heartbeat_at 
         FROM advisor_profile 
         WHERE user_id = $1`,
        [advisorUser.id]
      );
      expect(initialCheck.rows[0].is_online).toBe(true);
      expect(initialCheck.rows[0].last_heartbeat_at).not.toBeNull();

      // Step 2: Simulate connection failure by setting last_heartbeat_at to 61+ seconds ago
      await pool.query(
        `UPDATE advisor_profile
         SET last_heartbeat_at = NOW() - INTERVAL '61 seconds'
         WHERE user_id = $1`,
        [advisorUser.id]
      );

      // Verify the heartbeat was set to old timestamp
      const staleCheck = await pool.query(
        `SELECT is_online, last_heartbeat_at,
                EXTRACT(EPOCH FROM (NOW() - last_heartbeat_at)) as seconds_ago
         FROM advisor_profile 
         WHERE user_id = $1`,
        [advisorUser.id]
      );
      const secondsAgo = parseFloat(staleCheck.rows[0].seconds_ago);
      expect(secondsAgo).toBeGreaterThanOrEqual(61);
      expect(staleCheck.rows[0].is_online).toBe(true); // Still online before stale check

      // Step 3: Trigger stale check by calling heartbeat endpoint
      // The endpoint checks for stale heartbeats on every request (lines 64-69)
      const staleRequest = new Request('http://localhost/api/marketplace/advisors/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const staleResponse = await POST(staleRequest);
      expect(staleResponse.status).toBe(200);

      const staleData = await staleResponse.json();
      // Advisor should now be offline, so heartbeat is ignored
      expect(staleData.data.message).toBe('Heartbeat ignored - advisor is offline');

      // Step 4: Verify advisor is now offline in database
      const finalCheck = await pool.query(
        `SELECT is_online, last_heartbeat_at
         FROM advisor_profile 
         WHERE user_id = $1`,
        [advisorUser.id]
      );

      expect(finalCheck.rows[0].is_online).toBe(false);
      // last_heartbeat_at should be NULL after stale check (as per line 66)
      expect(finalCheck.rows[0].last_heartbeat_at).toBeNull();
    });

    test('should keep advisor online when heartbeat is received within timeout window', async () => {
      if (!checkDatabaseAvailability() || !pool || !advisorUser) {
        console.log('Skipping test: Database not available');
        return;
      }

      // Generate JWT token for advisor user
      const token = jwt.sign({ userId: advisorUser.id }, process.env.JWT_SECRET);

      // Mock cookies to return a mock cookie store
      const { cookies } = require('next/headers');
      const mockCookieStore = {
        get: jest.fn((name) => {
          if (name === 'auth_token') {
            return { value: token };
          }
          return null;
        }),
        getAll: jest.fn(() => {
          return [{ name: 'auth_token', value: token }];
        }),
      };
      cookies.mockResolvedValue(mockCookieStore);

      // Mock getAuthenticatedUser to return the advisor user
      const { getAuthenticatedUser } = require('@/lib/auth');
      getAuthenticatedUser.mockResolvedValue({
        userId: advisorUser.id,
        user: {
          id: advisorUser.id,
          email: advisorEmail,
          firstName: 'Test',
          lastName: 'Advisor',
          role: 'user',
        },
      });

      // Step 1: Send initial heartbeat
      const initialRequest = new Request('http://localhost/api/marketplace/advisors/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const initialResponse = await POST(initialRequest);
      expect(initialResponse.status).toBe(200);

      const initialData = await initialResponse.json();
      expect(initialData.success).toBe(true);
      expect(initialData.data.last_heartbeat_at).not.toBeNull();

      // Get initial heartbeat timestamp
      const initialTimestamp = await pool.query(
        `SELECT last_heartbeat_at 
         FROM advisor_profile 
         WHERE user_id = $1`,
        [advisorUser.id]
      );
      const firstHeartbeatTime = new Date(initialTimestamp.rows[0].last_heartbeat_at);

      // Step 2: Wait a short time (5 seconds) and send another heartbeat
      await new Promise(resolve => setTimeout(resolve, 5000));

      const secondRequest = new Request('http://localhost/api/marketplace/advisors/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const secondResponse = await POST(secondRequest);
      expect(secondResponse.status).toBe(200);

      const secondData = await secondResponse.json();
      expect(secondData.success).toBe(true);
      expect(secondData.data.last_heartbeat_at).not.toBeNull();

      // Step 3: Verify advisor remains online and heartbeat was updated
      const finalCheck = await pool.query(
        `SELECT is_online, last_heartbeat_at
         FROM advisor_profile 
         WHERE user_id = $1`,
        [advisorUser.id]
      );

      expect(finalCheck.rows[0].is_online).toBe(true);
      expect(finalCheck.rows[0].last_heartbeat_at).not.toBeNull();

      // Verify heartbeat timestamp was updated (should be more recent than first heartbeat)
      const secondHeartbeatTime = new Date(finalCheck.rows[0].last_heartbeat_at);
      expect(secondHeartbeatTime.getTime()).toBeGreaterThan(firstHeartbeatTime.getTime());

      // Verify the time difference is approximately 5 seconds (with some tolerance)
      const timeDiff = (secondHeartbeatTime.getTime() - firstHeartbeatTime.getTime()) / 1000;
      expect(timeDiff).toBeGreaterThanOrEqual(4); // At least 4 seconds (accounting for test execution time)
      expect(timeDiff).toBeLessThan(10); // Less than 10 seconds (should be around 5)
    });
  });
});

