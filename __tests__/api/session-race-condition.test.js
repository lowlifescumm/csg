/**
 * Race Condition Test: Insufficient Funds Auto-Terminate
 * 
 * Verifies that when a session ends exactly as the last cent is deducted
 * (simulating the per-minute billing cron running simultaneously with a user disconnect),
 * the Insufficient Funds Auto-Terminate logic triggers correctly.
 * Ensures no double-billing occurs and the session state remains consistent.
 */

const { Pool } = require('pg');

// Import billing functions directly
// Note: These are ES modules, Next.js Jest should handle them
const { billSessionMinute } = require('@/lib/per-minute-billing');
const { finalizeSessionBilling } = require('@/lib/session-billing');

// Helper function to check database availability (called at runtime, not module load)
function checkDatabaseAvailability() {
  const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  return !!dbUrl && 
         dbUrl.trim() !== '' &&
         dbUrl.startsWith('postgresql://');
}

describe('Session Race Condition - Insufficient Funds Auto-Terminate', () => {
  let testPool; // Test pool for setup/cleanup
  let testUser; // User with $5.00 wallet balance
  let advisorUser; // Advisor user
  let testSession; // Active session

  beforeAll(async () => {
    const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
    if (!checkDatabaseAvailability()) {
      console.warn('Skipping database tests: TEST_DATABASE_URL or DATABASE_URL is not set');
      return;
    }

    try {
      testPool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl?.includes("localhost") ? false : { rejectUnauthorized: false },
      });
      // Test connection
      await testPool.query('SELECT 1');
    } catch (error) {
      console.error('Failed to connect to database:', error.message);
      throw error;
    }
  });

  afterAll(async () => {
    if (!checkDatabaseAvailability() || !testPool) {
      return;
    }

    // Comprehensive cleanup of all test data
    if (testSession?.id) {
      await pool.query('DELETE FROM advisor_sessions WHERE id = $1', [testSession.id]).catch(() => {});
    }

    if (testUser?.id) {
      // Clean up wallet-related data
      await pool.query('DELETE FROM wallet_ledger WHERE user_id = $1', [testUser.id]).catch(() => {});
      await pool.query('DELETE FROM user_wallet_snapshot WHERE user_id = $1', [testUser.id]).catch(() => {});
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
      await testPool.query('DELETE FROM users WHERE id = $1', [advisorUser.id]).catch(() => {});
    }

    await testPool.end();
  });

  describe('Race Condition: Billing and Disconnect Simultaneously', () => {
    beforeEach(async () => {
      if (!checkDatabaseAvailability() || !testPool) {
        return;
      }

      // Create test user with exactly $5.00 wallet balance
      const userEmail = `test-race-condition-${Date.now()}@example.com`;
      const userResult = await testPool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, created_at)
         VALUES ($1, 'hashed_password', 'Test', 'User', NOW())
         RETURNING id`,
        [userEmail]
      );
      testUser = userResult.rows[0];

      // Add exactly $5.00 to wallet
      await testPool.query(
        `INSERT INTO wallet_ledger (user_id, amount, transaction_type, meta)
         VALUES ($1, 5.00, 'FUNDING', $2::jsonb)`,
        [testUser.id, JSON.stringify({ test: 'race_condition_test' })]
      );

      // Ensure snapshot exists (trigger should create it, but ensure for test)
      await testPool.query(
        `INSERT INTO user_wallet_snapshot (user_id, balance, updated_at)
         VALUES ($1, 5.00, NOW())
         ON CONFLICT (user_id) DO UPDATE SET balance = 5.00, updated_at = NOW()`,
        [testUser.id]
      );

      // Create advisor user and profile
      const advisorEmail = `test-advisor-race-${Date.now()}@example.com`;
      const advisorResult = await testPool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, created_at)
         VALUES ($1, 'hashed_password', 'Test', 'Advisor', NOW())
         RETURNING id`,
        [advisorEmail]
      );
      advisorUser = advisorResult.rows[0];

      // Create approved advisor profile with $5.00/min rate
      await testPool.query(
        `INSERT INTO advisor_profile (user_id, is_advisor, is_online, per_minute_rate, bio, specialties)
         VALUES ($1, true, true, 5.00, 'Test Advisor', $2::TEXT[])`,
        [advisorUser.id, ['Tarot']]
      );
    });

    afterEach(async () => {
      if (!checkDatabaseAvailability() || !testPool) {
        return;
      }

      // Clean up after each test
      if (testSession?.id) {
        await testPool.query('DELETE FROM advisor_sessions WHERE id = $1', [testSession.id]).catch(() => {});
        testSession = null;
      }

      if (testUser?.id) {
        await testPool.query('DELETE FROM wallet_ledger WHERE user_id = $1', [testUser.id]).catch(() => {});
        await testPool.query('DELETE FROM user_wallet_snapshot WHERE user_id = $1', [testUser.id]).catch(() => {});
      }

      if (advisorUser?.id) {
        await testPool.query('DELETE FROM advisor_profile WHERE user_id = $1', [advisorUser.id]).catch(() => {});
      }
    });

    test('should handle race condition when session ends as last cent is deducted', async () => {
      if (!checkDatabaseAvailability() || !testPool || !testUser || !advisorUser) {
        console.log('Skipping test: Database not available');
        return;
      }

      // Create active session that has been running for 1 minute
      const sessionResult = await testPool.query(
        `INSERT INTO advisor_sessions (user_id, advisor_id, status, start_time, per_minute_rate, total_cost_usd, meta)
         VALUES ($1, $2, 'ACTIVE', NOW() - INTERVAL '1 minute', 5.00, 0.00, $3::jsonb)
         RETURNING id, user_id, advisor_id, status, start_time, per_minute_rate, total_cost_usd, meta`,
        [testUser.id, advisorUser.id, JSON.stringify({})]
      );
      testSession = sessionResult.rows[0];

      // Verify initial state: session is ACTIVE, balance is $5.00
      const initialBalanceResult = await testPool.query(
        `SELECT balance FROM user_wallet_snapshot WHERE user_id = $1`,
        [testUser.id]
      );
      const initialBalance = parseFloat(initialBalanceResult.rows[0].balance);
      expect(initialBalance).toBe(5.00);
      expect(testSession.status).toBe('ACTIVE');

      // Scenario A: Per-minute billing detects insufficient funds and auto-terminates
      // Get a client connection for billSessionMinute (use test pool)
      const client = await testPool.connect();
      try {
        // First, bill the first minute (balance $5.00 should be sufficient for 1 minute at $5.00/min)
        const firstBillingResult = await billSessionMinute(client, testSession);
        
        // The first minute should bill successfully (balance exactly equals rate)
        expect(firstBillingResult.success).toBe(true);
        expect(firstBillingResult.amount_debited).toBe(5.00);
        expect(firstBillingResult.minutes_billed).toBe(1);

        // Verify balance is now $0.00
        const afterFirstBillingResult = await testPool.query(
          `SELECT balance FROM user_wallet_snapshot WHERE user_id = $1`,
          [testUser.id]
        );
        const balanceAfterFirst = parseFloat(afterFirstBillingResult.rows[0].balance);
        expect(balanceAfterFirst).toBe(0.00);

        // Verify session is still ACTIVE
        const sessionAfterFirst = await testPool.query(
          `SELECT status, total_cost_usd FROM advisor_sessions WHERE id = $1`,
          [testSession.id]
        );
        expect(sessionAfterFirst.rows[0].status).toBe('ACTIVE');
        expect(parseFloat(sessionAfterFirst.rows[0].total_cost_usd)).toBe(5.00);

        // Update session to simulate next minute (update last_billed_minute in meta)
        await testPool.query(
          `UPDATE advisor_sessions
           SET meta = jsonb_set(COALESCE(meta, '{}'::jsonb), '{last_billed_minute}', '1', true)
           WHERE id = $1`,
          [testSession.id]
        );

        // Update start_time to make it 2 minutes ago (so next billing cycle calculates 2 minutes elapsed)
        await testPool.query(
          `UPDATE advisor_sessions
           SET start_time = NOW() - INTERVAL '2 minutes'
           WHERE id = $1`,
          [testSession.id]
        );

        // Refresh session data
        const updatedSessionResult = await testPool.query(
          `SELECT id, user_id, advisor_id, status, start_time, per_minute_rate, total_cost_usd, meta
           FROM advisor_sessions
           WHERE id = $1`,
          [testSession.id]
        );
        const updatedSession = updatedSessionResult.rows[0];

        // Now try to bill the second minute - should detect insufficient funds and auto-terminate
        const secondBillingResult = await billSessionMinute(client, updatedSession);

        // Should detect insufficient funds and terminate
        expect(secondBillingResult.success).toBe(false);
        expect(secondBillingResult.terminated).toBe(true);
        expect(secondBillingResult.error).toContain('Insufficient funds');

        // Verify session is now COMPLETED
        const sessionAfterTermination = await testPool.query(
          `SELECT status, end_time, total_cost_usd, meta
           FROM advisor_sessions
           WHERE id = $1`,
          [testSession.id]
        );
        expect(sessionAfterTermination.rows[0].status).toBe('COMPLETED');
        expect(sessionAfterTermination.rows[0].end_time).not.toBeNull();

        // Verify termination reason in meta
        const meta = sessionAfterTermination.rows[0].meta || {};
        expect(meta.termination_reason).toBe('insufficient_funds');

        // Scenario B: User disconnects simultaneously (idempotency check)
        // Try to finalize billing again (simulating concurrent disconnect)
        const concurrentDisconnectResult = await finalizeSessionBilling(
          testSession.id,
          testUser.id,
          'user_disconnect'
        );

        // Should return success with already_finalized flag (idempotency)
        expect(concurrentDisconnectResult.success).toBe(true);
        expect(concurrentDisconnectResult.data.already_finalized).toBe(true);

        // Verify session status is still COMPLETED (not changed)
        const sessionAfterDisconnect = await testPool.query(
          `SELECT status FROM advisor_sessions WHERE id = $1`,
          [testSession.id]
        );
        expect(sessionAfterDisconnect.rows[0].status).toBe('COMPLETED');

        // Verify only ONE SESSION_DEBIT entry exists in wallet_ledger
        const debitCountResult = await testPool.query(
          `SELECT COUNT(*) as debit_count, SUM(ABS(amount)) as total_debited
           FROM wallet_ledger
           WHERE user_id = $1 
             AND transaction_type = 'SESSION_DEBIT'
             AND meta->>'session_id' = $2::text`,
          [testUser.id, testSession.id.toString()]
        );
        expect(parseInt(debitCountResult.rows[0].debit_count)).toBe(1);
        expect(parseFloat(debitCountResult.rows[0].total_debited)).toBe(5.00);

        // Verify only ONE EARNING_CREDIT entry exists in wallet_ledger for advisor
        const creditCountResult = await testPool.query(
          `SELECT COUNT(*) as credit_count, SUM(amount) as total_credited
           FROM wallet_ledger
           WHERE user_id = $1 
             AND transaction_type = 'EARNING_CREDIT'
             AND meta->>'session_id' = $2::text`,
          [advisorUser.id, testSession.id.toString()]
        );
        expect(parseInt(creditCountResult.rows[0].credit_count)).toBe(1);
        expect(parseFloat(creditCountResult.rows[0].total_credited)).toBe(5.00);

        // Verify final wallet balance is $0.00 (exactly one $5.00 debit occurred)
        const finalBalanceResult = await testPool.query(
          `SELECT balance FROM user_wallet_snapshot WHERE user_id = $1`,
          [testUser.id]
        );
        const finalBalance = parseFloat(finalBalanceResult.rows[0].balance);
        expect(finalBalance).toBe(0.00);
      } finally {
        client.release();
      }
    });
  });

  describe('Edge Case: Balance Exactly Equals Rate', () => {
    beforeEach(async () => {
      if (!checkDatabaseAvailability() || !testPool) {
        return;
      }

      // Create test user with exactly $5.00 wallet balance
      const userEmail = `test-edge-case-${Date.now()}@example.com`;
      const userResult = await testPool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, created_at)
         VALUES ($1, 'hashed_password', 'Test', 'User', NOW())
         RETURNING id`,
        [userEmail]
      );
      testUser = userResult.rows[0];

      // Add exactly $5.00 to wallet
      await testPool.query(
        `INSERT INTO wallet_ledger (user_id, amount, transaction_type, meta)
         VALUES ($1, 5.00, 'FUNDING', $2::jsonb)`,
        [testUser.id, JSON.stringify({ test: 'edge_case_test' })]
      );

      // Ensure snapshot exists
      await testPool.query(
        `INSERT INTO user_wallet_snapshot (user_id, balance, updated_at)
         VALUES ($1, 5.00, NOW())
         ON CONFLICT (user_id) DO UPDATE SET balance = 5.00, updated_at = NOW()`,
        [testUser.id]
      );

      // Create advisor user and profile
      const advisorEmail = `test-advisor-edge-${Date.now()}@example.com`;
      const advisorResult = await testPool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, created_at)
         VALUES ($1, 'hashed_password', 'Test', 'Advisor', NOW())
         RETURNING id`,
        [advisorEmail]
      );
      advisorUser = advisorResult.rows[0];

      // Create approved advisor profile with $5.00/min rate
      await testPool.query(
        `INSERT INTO advisor_profile (user_id, is_advisor, is_online, per_minute_rate, bio, specialties)
         VALUES ($1, true, true, 5.00, 'Test Advisor', $2::TEXT[])`,
        [advisorUser.id, ['Tarot']]
      );
    });

    afterEach(async () => {
      if (!checkDatabaseAvailability() || !testPool) {
        return;
      }

      // Clean up after each test
      if (testSession?.id) {
        await testPool.query('DELETE FROM advisor_sessions WHERE id = $1', [testSession.id]).catch(() => {});
        testSession = null;
      }

      if (testUser?.id) {
        await testPool.query('DELETE FROM wallet_ledger WHERE user_id = $1', [testUser.id]).catch(() => {});
        await testPool.query('DELETE FROM user_wallet_snapshot WHERE user_id = $1', [testUser.id]).catch(() => {});
      }

      if (advisorUser?.id) {
        await testPool.query('DELETE FROM advisor_profile WHERE user_id = $1', [advisorUser.id]).catch(() => {});
      }
    });

    test('should allow billing when balance exactly equals rate, then terminate on next cycle', async () => {
      if (!checkDatabaseAvailability() || !testPool || !testUser || !advisorUser) {
        console.log('Skipping test: Database not available');
        return;
      }

      // Create active session that has been running for 0 minutes (just started)
      const sessionResult = await testPool.query(
        `INSERT INTO advisor_sessions (user_id, advisor_id, status, start_time, per_minute_rate, total_cost_usd, meta)
         VALUES ($1, $2, 'ACTIVE', NOW(), 5.00, 0.00, $3::jsonb)
         RETURNING id, user_id, advisor_id, status, start_time, per_minute_rate, total_cost_usd, meta`,
        [testUser.id, advisorUser.id, JSON.stringify({})]
      );
      testSession = sessionResult.rows[0];

      // Verify initial balance is $5.00
      const initialBalanceResult = await testPool.query(
        `SELECT balance FROM user_wallet_snapshot WHERE user_id = $1`,
        [testUser.id]
      );
      const initialBalance = parseFloat(initialBalanceResult.rows[0].balance);
      expect(initialBalance).toBe(5.00);

      // Get a client connection for billSessionMinute (use test pool)
      const client = await testPool.connect();
      try {
        // First Billing Cycle: Balance ($5.00) should be sufficient for 1 minute ($5.00)
        // Update start_time to 1 minute ago to simulate elapsed time
        await testPool.query(
          `UPDATE advisor_sessions
           SET start_time = NOW() - INTERVAL '1 minute'
           WHERE id = $1`,
          [testSession.id]
        );

        // Refresh session data
        const firstSessionResult = await testPool.query(
          `SELECT id, user_id, advisor_id, status, start_time, per_minute_rate, total_cost_usd, meta
           FROM advisor_sessions
           WHERE id = $1`,
          [testSession.id]
        );
        const firstSession = firstSessionResult.rows[0];

        const firstBillingResult = await billSessionMinute(client, firstSession);

        // Should succeed (balance exactly equals rate)
        expect(firstBillingResult.success).toBe(true);
        expect(firstBillingResult.amount_debited).toBe(5.00);
        expect(firstBillingResult.minutes_billed).toBe(1);

        // Verify balance becomes $0.00
        const balanceAfterFirst = await testPool.query(
          `SELECT balance FROM user_wallet_snapshot WHERE user_id = $1`,
          [testUser.id]
        );
        expect(parseFloat(balanceAfterFirst.rows[0].balance)).toBe(0.00);

        // Verify session remains ACTIVE
        const sessionAfterFirst = await testPool.query(
          `SELECT status, total_cost_usd FROM advisor_sessions WHERE id = $1`,
          [testSession.id]
        );
        expect(sessionAfterFirst.rows[0].status).toBe('ACTIVE');
        expect(parseFloat(sessionAfterFirst.rows[0].total_cost_usd)).toBe(5.00);

        // Second Billing Cycle: Simulate next minute
        // Update last_billed_minute in meta and start_time
        await testPool.query(
          `UPDATE advisor_sessions
           SET meta = jsonb_set(COALESCE(meta, '{}'::jsonb), '{last_billed_minute}', '1', true),
               start_time = NOW() - INTERVAL '2 minutes'
           WHERE id = $1`,
          [testSession.id]
        );

        // Refresh session data
        const secondSessionResult = await testPool.query(
          `SELECT id, user_id, advisor_id, status, start_time, per_minute_rate, total_cost_usd, meta
           FROM advisor_sessions
           WHERE id = $1`,
          [testSession.id]
        );
        const secondSession = secondSessionResult.rows[0];

        // Now try to bill the second minute - should detect insufficient funds
        const secondBillingResult = await billSessionMinute(client, secondSession);

        // Should detect insufficient funds and auto-terminate
        expect(secondBillingResult.success).toBe(false);
        expect(secondBillingResult.terminated).toBe(true);
        expect(secondBillingResult.error).toContain('Insufficient funds');

        // Verify session status becomes COMPLETED
        const sessionAfterSecond = await testPool.query(
          `SELECT status, end_time, meta FROM advisor_sessions WHERE id = $1`,
          [testSession.id]
        );
        expect(sessionAfterSecond.rows[0].status).toBe('COMPLETED');
        expect(sessionAfterSecond.rows[0].end_time).not.toBeNull();

        // Verify termination_reason: 'insufficient_funds' in session meta
        const meta = sessionAfterSecond.rows[0].meta || {};
        expect(meta.termination_reason).toBe('insufficient_funds');
      } finally {
        client.release();
      }
    });
  });
});

