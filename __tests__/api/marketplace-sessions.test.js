/**
 * Financial Integrity Test: Marketplace Session Validation
 * 
 * Verifies that users with $0.00 USD wallet balance cannot initiate advisor sessions,
 * regardless of their AI credit balance. This ensures financial integrity by preventing
 * unpaid access to paid advisor services.
 */

const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// Import the route handler directly
const { POST } = require('@/app/api/marketplace/advisors/sessions/route');

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

describe('Marketplace Session Validation - Financial Integrity', () => {
  let pool;
  let testUser; // User with $0.00 wallet balance
  let advisorUser; // Advisor user
  let testUserEmail; // Store test user email for mock

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
    if (testUser?.id) {
      // Clean up wallet-related data
      await pool.query('DELETE FROM wallet_ledger WHERE user_id = $1', [testUser.id]).catch(() => {});
      await pool.query('DELETE FROM user_wallet_snapshot WHERE user_id = $1', [testUser.id]).catch(() => {});
      // Clean up credit ledger
      await pool.query('DELETE FROM credit_ledger WHERE user_id = $1', [testUser.id]).catch(() => {});
      // Clean up user
      await pool.query('DELETE FROM users WHERE id = $1', [testUser.id]).catch(() => {});
    }

    if (advisorUser?.id) {
      // Clean up advisor profile
      await pool.query('DELETE FROM advisor_profile WHERE user_id = $1', [advisorUser.id]).catch(() => {});
      // Clean up any wallet data for advisor (if any)
      await pool.query('DELETE FROM wallet_ledger WHERE user_id = $1', [advisorUser.id]).catch(() => {});
      await pool.query('DELETE FROM user_wallet_snapshot WHERE user_id = $1', [advisorUser.id]).catch(() => {});
      // Clean up user
      await pool.query('DELETE FROM users WHERE id = $1', [advisorUser.id]).catch(() => {});
    }

    await pool.end();
  });

  describe('Session Validation with Zero Wallet Balance', () => {
    beforeEach(async () => {
      // Clear all mocks before each test
      jest.clearAllMocks();
      
      if (!checkDatabaseAvailability() || !pool) {
        return;
      }

      // Create test user with $0.00 wallet balance
      testUserEmail = `test-zero-wallet-${Date.now()}@example.com`;
      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, created_at)
         VALUES ($1, 'hashed_password', 'Test', 'User', NOW())
         RETURNING id`,
        [testUserEmail]
      );
      testUser = userResult.rows[0];

      // Ensure user has $0.00 wallet balance (no wallet_ledger entries, no snapshot)
      // The snapshot will default to 0.00 if it doesn't exist, which is what we want

      // Add AI credits to verify they don't matter for session validation
      await pool.query(
        `INSERT INTO credit_ledger (user_id, delta, source, meta)
         VALUES ($1, 100, 'admin_adjustment', $2::jsonb)`,
        [testUser.id, JSON.stringify({ test: 'financial_integrity_test' })]
      );

      // Create advisor user and profile
      const advisorEmail = `test-advisor-${Date.now()}@example.com`;
      const advisorResult = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, created_at)
         VALUES ($1, 'hashed_password', 'Test', 'Advisor', NOW())
         RETURNING id`,
        [advisorEmail]
      );
      advisorUser = advisorResult.rows[0];

      // Create approved, online advisor profile with $5.00/min rate
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
      if (testUser?.id) {
        await pool.query('DELETE FROM wallet_ledger WHERE user_id = $1', [testUser.id]).catch(() => {});
        await pool.query('DELETE FROM user_wallet_snapshot WHERE user_id = $1', [testUser.id]).catch(() => {});
        await pool.query('DELETE FROM credit_ledger WHERE user_id = $1', [testUser.id]).catch(() => {});
      }

      if (advisorUser?.id) {
        await pool.query('DELETE FROM advisor_profile WHERE user_id = $1', [advisorUser.id]).catch(() => {});
      }
    });

    test('should reject session validation when user has $0.00 wallet balance regardless of AI credits', async () => {
      if (!checkDatabaseAvailability() || !pool || !testUser) {
        console.log('Skipping test: Database not available');
        return;
      }

      // Generate JWT token for test user
      const token = jwt.sign({ userId: testUser.id }, process.env.JWT_SECRET);

      // Verify user has AI credits (to prove credits don't matter)
      const creditResult = await pool.query(
        `SELECT COALESCE(SUM(delta), 0) as total_credits
         FROM credit_ledger
         WHERE user_id = $1`,
        [testUser.id]
      );
      const totalCredits = parseFloat(creditResult.rows[0].total_credits);
      expect(totalCredits).toBeGreaterThan(0); // User has credits

      // Verify user has $0.00 wallet balance
      const walletResult = await pool.query(
        `SELECT balance FROM user_wallet_snapshot WHERE user_id = $1`,
        [testUser.id]
      );
      const walletBalance = walletResult.rows.length > 0
        ? parseFloat(walletResult.rows[0].balance) || 0
        : 0;
      expect(walletBalance).toBe(0); // User has zero wallet balance

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

      // Mock getAuthenticatedUser to return the test user
      const { getAuthenticatedUser } = require('@/lib/auth');
      getAuthenticatedUser.mockResolvedValue({
        userId: testUser.id,
        user: {
          id: testUser.id,
          email: testUserEmail,
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
        },
      });

      // Create a mock Request object
      const request = new Request('http://localhost/api/marketplace/advisors/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advisor_id: advisorUser.id,
        }),
      });

      // Call the route handler directly
      const response = await POST(request);

      // Assertions: Should be rejected with 402 Payment Required
      expect(response.status).toBe(402);

      const data = await response.json();
      expect(data.error).toBe('Insufficient funds');
      expect(data.data).toBeDefined();
      expect(data.data.valid).toBe(false);
      expect(data.data.advisor_rate).toBe(5.00);
      expect(data.data.user_balance).toBe(0);
      expect(data.data.required).toBe(5.00);
      expect(data.data.shortfall).toBe(5.00);

      // Verify AI credits were NOT checked/used (user still has credits)
      const creditCheckResult = await pool.query(
        `SELECT COALESCE(SUM(delta), 0) as total_credits
         FROM credit_ledger
         WHERE user_id = $1`,
        [testUser.id]
      );
      const creditsAfter = parseFloat(creditCheckResult.rows[0].total_credits);
      expect(creditsAfter).toBe(totalCredits); // Credits unchanged
    });

    test('should allow session validation when user has sufficient wallet balance', async () => {
      if (!checkDatabaseAvailability() || !pool || !testUser) {
        console.log('Skipping test: Database not available');
        return;
      }

      // Add $10.00 to user's wallet
      await pool.query(
        `INSERT INTO wallet_ledger (user_id, amount, transaction_type, meta)
         VALUES ($1, 10.00, 'FUNDING', $2::jsonb)`,
        [testUser.id, JSON.stringify({ test: 'financial_integrity_test' })]
      );

      // The trigger should automatically update user_wallet_snapshot
      // But let's verify it exists and has the correct balance
      const snapshotCheck = await pool.query(
        `SELECT balance FROM user_wallet_snapshot WHERE user_id = $1`,
        [testUser.id]
      );

      // If snapshot doesn't exist yet, the trigger should create it
      // But in case it doesn't, we'll manually ensure it exists
      if (snapshotCheck.rows.length === 0) {
        // Manually update snapshot (trigger should handle this, but ensuring for test)
        await pool.query(
          `INSERT INTO user_wallet_snapshot (user_id, balance, updated_at)
           VALUES ($1, 10.00, NOW())
           ON CONFLICT (user_id) DO UPDATE SET balance = 10.00, updated_at = NOW()`,
          [testUser.id]
        );
      }

      // Verify wallet balance is $10.00
      const walletResult = await pool.query(
        `SELECT balance FROM user_wallet_snapshot WHERE user_id = $1`,
        [testUser.id]
      );
      const walletBalance = parseFloat(walletResult.rows[0].balance);
      expect(walletBalance).toBe(10.00);

      // Verify user still has AI credits (to prove credits aren't used)
      const creditResult = await pool.query(
        `SELECT COALESCE(SUM(delta), 0) as total_credits
         FROM credit_ledger
         WHERE user_id = $1`,
        [testUser.id]
      );
      const totalCredits = parseFloat(creditResult.rows[0].total_credits);
      expect(totalCredits).toBeGreaterThan(0);

      // Generate JWT token for test user
      const token = jwt.sign({ userId: testUser.id }, process.env.JWT_SECRET);

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

      // Mock getAuthenticatedUser to return the test user
      const { getAuthenticatedUser } = require('@/lib/auth');
      getAuthenticatedUser.mockResolvedValue({
        userId: testUser.id,
        user: {
          id: testUser.id,
          email: testUserEmail,
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
        },
      });

      // Create a mock Request object
      const request = new Request('http://localhost/api/marketplace/advisors/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advisor_id: advisorUser.id,
        }),
      });

      // Call the route handler directly
      const response = await POST(request);

      // Assertions: Should be allowed with 200 OK
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.valid).toBe(true);
      expect(data.data.advisor_rate).toBe(5.00);
      expect(data.data.user_balance).toBe(10.00);
      expect(data.data.can_afford_minutes).toBe(2); // 10.00 / 5.00 = 2 minutes

      // Verify AI credits were NOT used (still have credits)
      const creditCheckResult = await pool.query(
        `SELECT COALESCE(SUM(delta), 0) as total_credits
         FROM credit_ledger
         WHERE user_id = $1`,
        [testUser.id]
      );
      const creditsAfter = parseFloat(creditCheckResult.rows[0].total_credits);
      expect(creditsAfter).toBe(totalCredits); // Credits unchanged
    });
  });
});
