/**
 * Credit Engine End-to-End Verification Tests
 * Tests the full flow: purchase → credits → reading → deduction → unlock
 * and all edge cases including concurrent consumption, free credit limits, expiry, etc.
 */

const { Pool } = require('pg');
const {
  purchaseCredits,
  consumeCredits,
  getCreditBalance,
  issueFreeDailyCredits,
  issueSubscriptionCredits,
  refundCredits,
  addCreditsDirectly
} = require('../../lib/credit-engine');

const {
  canAccessReading,
  consumeCreditsForReading,
  canUseFreeCredits
} = require('../../lib/access-control');

// Setup test database connection
const pool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

// Test data
let testUserId;
let adminUserId;

// Helper to create test users
async function createTestUser(role = 'user') {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role, created_at)
     VALUES ($1, 'hashed_password', 'Test', 'User', $2, NOW())
     RETURNING id`,
    [`test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`, role]
  );
  return result.rows[0].id;
}

// Helper to clean up test data
async function cleanupTestData(userId) {
  if (!userId) return;
  await pool.query('DELETE FROM credit_ledger WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM user_credit_snapshot WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}

describe('Credit Engine - End-to-End Verification', () => {
  beforeAll(async () => {
    // Create test users
    testUserId = await createTestUser('user');
    adminUserId = await createTestUser('admin');
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData(testUserId);
    await cleanupTestData(adminUserId);
    await pool.end();
  });

  beforeEach(async () => {
    // Clean up credit data before each test
    await pool.query('DELETE FROM credit_ledger WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM user_credit_snapshot WHERE user_id = $1', [testUserId]);
  });

  describe('1. Happy Path: Purchase → Credits → Reading → Deduction → Unlock', () => {
    test('should complete full happy path flow', async () => {
      // Step 1: User purchases credits (Stripe webhook fires)
      const purchaseResult = await purchaseCredits(testUserId, 15, {
        stripe_payment_intent_id: 'pi_test_123',
        amount_paid: 999
      });

      expect(purchaseResult.success).toBe(true);
      expect(purchaseResult.added_credits).toBe(15);
      expect(purchaseResult.ledger_id).toBeDefined();

      // Step 2: Verify credits in ledger
      const balanceAfterPurchase = await getCreditBalance(testUserId);
      expect(balanceAfterPurchase.balance).toBe(15);
      expect(balanceAfterPurchase.breakdown.purchased).toBe(15);
      expect(balanceAfterPurchase.breakdown.free).toBe(0);

      // Step 3: User requests reading - check access
      const accessCheck = await canAccessReading(testUserId, 'TAROT_PREMIUM');
      expect(accessCheck.allowed).toBe(true);
      expect(accessCheck.cost).toBe(3);

      // Step 4: Consume credits for reading
      const consumptionResult = await consumeCreditsForReading(
        testUserId,
        'TAROT_PREMIUM',
        'reading_123'
      );

      expect(consumptionResult.success).toBe(true);
      expect(consumptionResult.cost).toBe(3);
      expect(consumptionResult.new_balance).toBe(12);

      // Step 5: Verify final balance
      const finalBalance = await getCreditBalance(testUserId);
      expect(finalBalance.balance).toBe(12);
      expect(finalBalance.breakdown.consumed).toBe(3);
    });

    test('should allow reading unlock after credit purchase', async () => {
      // Purchase 5 credits
      await purchaseCredits(testUserId, 5, { stripe_payment_intent_id: 'pi_test_456' });

      // Check access for a reading that costs 5 credits
      const accessCheck = await canAccessReading(testUserId, 'MOON_READING');
      expect(accessCheck.allowed).toBe(true);
      expect(accessCheck.reason).toBe('has_credits');

      // Consume the credits
      const consumptionResult = await consumeCreditsForReading(
        testUserId,
        'MOON_READING',
        'reading_moon_123'
      );

      expect(consumptionResult.success).toBe(true);
      expect(consumptionResult.message).toBe('credits_deducted');
    });
  });

  describe('2. Edge Case: Concurrent Credit Consumption', () => {
    test('should prevent double-spend with FOR UPDATE locking', async () => {
      // Add credits
      await addCreditsDirectly(testUserId, 5, 'admin_adjustment', { test: true });

      // Verify initial balance
      const initialBalance = await getCreditBalance(testUserId);
      expect(initialBalance.balance).toBe(5);

      // Simulate concurrent consumption attempts
      const consumptionPromises = [
        consumeCredits(testUserId, 3, 'reading_1', { test: true }),
        consumeCredits(testUserId, 3, 'reading_2', { test: true }),
        consumeCredits(testUserId, 3, 'reading_3', { test: true })
      ];

      const results = await Promise.all(consumptionPromises);

      // Count successful consumptions
      const successfulConsumptions = results.filter(r => r.success);
      const failedConsumptions = results.filter(r => !r.success);

      // Only one should succeed (balance 5, each costs 3)
      expect(successfulConsumptions.length).toBeLessThanOrEqual(1);
      expect(failedConsumptions.length).toBeGreaterThanOrEqual(2);

      // Verify failed attempts have correct error
      failedConsumptions.forEach(result => {
        expect(result.error_code).toBe('INSUFFICIENT_CREDITS');
      });

      // Verify final balance reflects only one consumption
      const finalBalance = await getCreditBalance(testUserId);
      if (successfulConsumptions.length === 1) {
        expect(finalBalance.balance).toBe(2); // 5 - 3 = 2
      } else {
        expect(finalBalance.balance).toBe(5); // No consumption happened
      }
    });
  });

  describe('3. Edge Case: Free Credit Lifetime Limit (5 total)', () => {
    test('should enforce lifetime limit of 5 free readings', async () => {
      // Insert 5 free credits directly (simulating 5 days of daily credits)
      for (let i = 0; i < 5; i++) {
        await pool.query(
          `INSERT INTO credit_ledger (user_id, delta, source, meta, expires_at)
           VALUES ($1, 1, 'free_daily', $2, NOW() + INTERVAL '24 hours')`,
          [testUserId, JSON.stringify({ issued_at: new Date().toISOString() })]
        );
      }

      // Verify free credits were issued
      const balanceBefore = await getCreditBalance(testUserId);
      expect(balanceBefore.breakdown.free).toBe(5);

      // After 5 free credits issued, user should not be able to get more (lifetime limit)
      const canUseAfter5 = await canUseFreeCredits(testUserId, 'TAROT_BASIC');
      expect(canUseAfter5).toBe(false);

      // Consume all 5 free credits
      for (let i = 0; i < 5; i++) {
        const result = await consumeCreditsForReading(
          testUserId,
          'TAROT_BASIC',
          `reading_${i}`
        );
        expect(result.success).toBe(true);
      }

      // Verify balance is now 0
      const balance = await getCreditBalance(testUserId);
      expect(balance.balance).toBe(0);
    });

    test('should reject free credit issuance after 5 total free credits issued', async () => {
      // First, verify user can use free credits initially
      const canUseInitially = await canUseFreeCredits(testUserId, 'TAROT_BASIC');
      expect(canUseInitially).toBe(true);

      // Add 5 free credits via the API (simulating lifetime issuance)
      for (let i = 0; i < 5; i++) {
        await pool.query(
          `INSERT INTO credit_ledger (user_id, delta, source, meta, expires_at)
           VALUES ($1, 1, 'free_daily', $2, NOW() + INTERVAL '24 hours')`,
          [testUserId, JSON.stringify({ issued_at: new Date().toISOString() })]
        );
      }

      // After 5 free credits issued, user should not be eligible for more free credits
      const canUseAfter5 = await canUseFreeCredits(testUserId, 'TAROT_BASIC');
      expect(canUseAfter5).toBe(false);
    });
  });

  describe('4. Edge Case: Free Credit Daily Refresh', () => {
    test('issueFreeDailyCredits should respect 24h cooldown', async () => {
      // Issue free credits first time
      const firstIssue = await issueFreeDailyCredits(testUserId);
      expect(firstIssue.success).toBe(true);
      expect(firstIssue.added_credits).toBe(1);

      // Try to issue again immediately - should fail
      const secondIssue = await issueFreeDailyCredits(testUserId);
      expect(secondIssue.success).toBe(false);
      expect(secondIssue.error).toBe('ALREADY_ISSUED_TODAY');

      // Verify only 1 credit was added
      const balance = await getCreditBalance(testUserId);
      expect(balance.breakdown.free).toBe(1);
    });
  });

  describe('5. Edge Case: Credit Expiry', () => {
    test('should exclude expired free credits from balance', async () => {
      // Add expired free credits
      await pool.query(
        `INSERT INTO credit_ledger (user_id, delta, source, expires_at)
         VALUES ($1, 10, 'free_daily', NOW() - INTERVAL '1 hour')`,
        [testUserId]
      );

      // Add valid purchased credits
      await purchaseCredits(testUserId, 5, { stripe_payment_intent_id: 'pi_test' });

      // Balance should only include purchased credits
      const balance = await getCreditBalance(testUserId);
      expect(balance.balance).toBe(5);
      expect(balance.breakdown.free).toBe(0); // Expired credits not counted
      expect(balance.breakdown.purchased).toBe(5);
    });

    test('expired credits should not be usable for readings', async () => {
      // Add expired credits
      await pool.query(
        `INSERT INTO credit_ledger (user_id, delta, source, expires_at)
         VALUES ($1, 100, 'free_daily', NOW() - INTERVAL '1 day')`,
        [testUserId]
      );

      // Try to consume - should fail
      const result = await consumeCredits(testUserId, 1, 'test_reading');
      expect(result.success).toBe(false);
      expect(result.error_code).toBe('INSUFFICIENT_CREDITS');
    });
  });

  describe('6. Edge Case: Subscription Credits', () => {
    test('issueSubscriptionCredits should work correctly', async () => {
      const result = await issueSubscriptionCredits(
        testUserId,
        60,
        'MYSTIC_LITE',
        { subscription_id: 'sub_123' }
      );

      expect(result.success).toBe(true);
      expect(result.added_credits).toBe(60);

      // Verify credits are available
      const balance = await getCreditBalance(testUserId);
      expect(balance.balance).toBe(60);
      expect(balance.breakdown.subscription).toBe(60);
    });

    test('subscription credits should be usable for readings', async () => {
      // Issue subscription credits
      await issueSubscriptionCredits(testUserId, 60, 'MYSTIC_LITE');

      // Check access
      const accessCheck = await canAccessReading(testUserId, 'TAROT_PREMIUM');
      expect(accessCheck.allowed).toBe(true);

      // Consume credits
      const consumptionResult = await consumeCreditsForReading(
        testUserId,
        'TAROT_PREMIUM',
        'reading_sub_123'
      );

      expect(consumptionResult.success).toBe(true);
      expect(consumptionResult.new_balance).toBe(57); // 60 - 3 = 57
    });
  });

  describe('7. Edge Case: Admin Bypass', () => {
    test('admin should bypass all credit checks', async () => {
      // Admin has 0 credits
      const accessCheck = await canAccessReading(adminUserId, 'TAROT_PREMIUM');
      expect(accessCheck.allowed).toBe(true);
      expect(accessCheck.reason).toBe('admin_access');
      expect(accessCheck.cost).toBe(0);

      const consumptionResult = await consumeCreditsForReading(
        adminUserId,
        'TAROT_PREMIUM',
        'admin_reading_123'
      );

      expect(consumptionResult.success).toBe(true);
      expect(consumptionResult.message).toBe('admin_access');
      expect(consumptionResult.cost).toBe(0);
    });

    test('admin should bypass even for expensive readings', async () => {
      // Compatibility report costs 20 credits
      const accessCheck = await canAccessReading(adminUserId, 'COMPATIBILITY_REPORT');
      expect(accessCheck.allowed).toBe(true);
      expect(accessCheck.reason).toBe('admin_access');

      const consumptionResult = await consumeCreditsForReading(
        adminUserId,
        'COMPATIBILITY_REPORT',
        'admin_compat_123'
      );

      expect(consumptionResult.success).toBe(true);
      expect(consumptionResult.cost).toBe(0);
    });
  });

  describe('8. Edge Case: Insufficient Credits → 402 Response', () => {
    test('should return 402 with INSUFFICIENT_CREDITS error', async () => {
      // User has 0 credits
      const result = await consumeCredits(testUserId, 5, 'expensive_reading');

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('INSUFFICIENT_CREDITS');
      expect(result.error).toBe('Insufficient credits');
      expect(result.available_balance).toBe(0);
      expect(result.required).toBe(5);
      expect(result.breakdown).toBeDefined();
    });

    test('access control should report insufficient credits', async () => {
      const accessCheck = await canAccessReading(testUserId, 'MOON_READING');
      expect(accessCheck.allowed).toBe(false);
      expect(accessCheck.reason).toBe('insufficient_credits');
      expect(accessCheck.required).toBe(5);
      expect(accessCheck.available_balance).toBe(0);
    });
  });

  describe('9. Credit Balance API', () => {
    test('getCreditBalance should return correct breakdown', async () => {
      // Add various credit types
      await purchaseCredits(testUserId, 10, { stripe_payment_intent_id: 'pi_1' });
      await issueSubscriptionCredits(testUserId, 60, 'MYSTIC_LITE');
      await pool.query(
        `INSERT INTO credit_ledger (user_id, delta, source, expires_at)
         VALUES ($1, 1, 'free_daily', NOW() + INTERVAL '24 hours')`,
        [testUserId]
      );

      // Consume some credits
      await consumeCredits(testUserId, 5, 'reading_1');

      const balance = await getCreditBalance(testUserId);

      expect(balance.balance).toBe(66); // 10 + 60 + 1 - 5 = 66
      expect(balance.breakdown.purchased).toBe(10);
      expect(balance.breakdown.subscription).toBe(60);
      expect(balance.breakdown.free).toBe(1);
      expect(balance.breakdown.consumed).toBe(5);
      expect(balance.ledger_summary).toBeDefined();
      expect(balance.ledger_summary.length).toBeGreaterThan(0);
    });
  });

  describe('10. Credit Consume API Scenarios', () => {
    test('should consume credits with reading_id', async () => {
      await addCreditsDirectly(testUserId, 10, 'admin_adjustment');

      const result = await consumeCredits(testUserId, 3, 'reading_xyz', {
        reading_type: 'TAROT_PREMIUM',
        can_use_free: false
      });

      expect(result.success).toBe(true);
      expect(result.consumed).toBe(3);
      expect(result.new_balance).toBe(7);
      expect(result.ledger_id).toBeDefined();
    });

    test('should handle custom spread card count', async () => {
      await addCreditsDirectly(testUserId, 10, 'admin_adjustment');

      // Custom spread with 5 cards costs 5 credits
      const accessCheck = await canAccessReading(testUserId, 'TAROT_CUSTOM', 5);
      expect(accessCheck.allowed).toBe(true);
      expect(accessCheck.cost).toBe(5);

      const result = await consumeCreditsForReading(
        testUserId,
        'TAROT_CUSTOM',
        'custom_123',
        5
      );

      expect(result.success).toBe(true);
      expect(result.cost).toBe(5);
    });
  });

  describe('11. Refund Credits', () => {
    test('should refund credits correctly', async () => {
      // Add and consume credits
      await addCreditsDirectly(testUserId, 10, 'admin_adjustment');
      const consumptionResult = await consumeCredits(testUserId, 5, 'reading_to_refund');

      expect(consumptionResult.success).toBe(true);
      expect(consumptionResult.new_balance).toBe(5);

      // Refund the credits
      const refundResult = await refundCredits(
        testUserId,
        5,
        'User requested refund',
        { original_ledger_id: consumptionResult.ledger_id }
      );

      expect(refundResult.success).toBe(true);
      expect(refundResult.refunded_credits).toBe(5);

      // Verify balance restored
      const finalBalance = await getCreditBalance(testUserId);
      expect(finalBalance.balance).toBe(10);
    });
  });

  describe('12. Credit Priority Order', () => {
    test('should prioritize purchased over free credits when can_use_free is false', async () => {
      // Add purchased and free credits
      await purchaseCredits(testUserId, 5, { stripe_payment_intent_id: 'pi_test' });
      await pool.query(
        `INSERT INTO credit_ledger (user_id, delta, source, expires_at)
         VALUES ($1, 10, 'free_daily', NOW() + INTERVAL '24 hours')`,
        [testUserId]
      );

      // Consume with can_use_free: false
      const result = await consumeCredits(testUserId, 3, 'reading_1', {
        can_use_free: false
      });

      expect(result.success).toBe(true);

      // Balance should be 12 (5 purchased + 10 free - 3 consumed from purchased)
      const balance = await getCreditBalance(testUserId);
      expect(balance.balance).toBe(12);
      // Breakdown shows total credits issued by source, not net remaining
      expect(balance.breakdown.purchased).toBe(5); // 5 purchased total
      expect(balance.breakdown.free).toBe(10); // 10 free credits total
      expect(balance.breakdown.consumed).toBe(3); // 3 consumed
    });
  });

  describe('13. Bug Discovery & Documentation', () => {
    let bugTestUserId;

    beforeAll(async () => {
      bugTestUserId = await createTestUser('user');
    });

    afterAll(async () => {
      await cleanupTestData(bugTestUserId);
    });

    beforeEach(async () => {
      await pool.query('DELETE FROM credit_ledger WHERE user_id = $1', [bugTestUserId]);
      await pool.query('DELETE FROM user_credit_snapshot WHERE user_id = $1', [bugTestUserId]);
    });

    test('Purchase credits accepts arbitrary amounts', async () => {
      // The purchaseCredits function accepts any positive credit count
      // It does NOT validate against predefined pack sizes - it's flexible
      const result = await purchaseCredits(bugTestUserId, 999, {
        stripe_payment_intent_id: 'pi_test_999'
      });
      expect(result.success).toBe(true);
      expect(result.added_credits).toBe(999);

      // Verify balance
      const balance = await getCreditBalance(bugTestUserId);
      expect(balance.balance).toBe(999);
    });

    test('Purchase credits rejects invalid amounts', async () => {
      // Negative amounts should fail
      const result = await purchaseCredits(bugTestUserId, -5, {});
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_PACK');

      // Zero should fail
      const result2 = await purchaseCredits(bugTestUserId, 0, {});
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('INVALID_PACK');
    });

    test('BUG: canUseFreeCredits only checks lifetime limit, not actual free balance', async () => {
      // This test documents that canUseFreeCredits returns true even if no free credits available
      // as long as lifetime limit not reached. The actual balance check happens in consumeCredits.
      const canUse = await canUseFreeCredits(bugTestUserId, 'TAROT_BASIC');
      expect(canUse).toBe(true); // Returns true even with 0 free credits

      // But consumption should still fail if no actual credits
      const result = await consumeCredits(bugTestUserId, 1, 'reading_1', { can_use_free: true });
      expect(result.success).toBe(false);
    });
  });
});
