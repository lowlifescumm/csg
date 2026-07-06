/**
 * Credit Engine Logic Tests - Scope Reduced for GSTA-534
 * Tests credit engine logic WITHOUT requiring PostgreSQL
 * Mocks the database layer to verify business logic is sound
 */

// Mock the pg Pool before imports
const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: mockQuery,
    connect: mockConnect,
  })),
}));

// Mock logger
jest.mock('../../lib/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}));

// Mock the db module
jest.mock('../../lib/db.js', () => ({
  pool: {
    query: mockQuery,
    connect: mockConnect,
  },
}));

const {
  purchaseCredits,
  consumeCredits,
  getCreditBalance,
  issueFreeDailyCredits,
  issueSubscriptionCredits,
  addCreditsDirectly,
} = require('../../lib/credit-engine');

describe('Credit Engine - Logic Verification (Scope Reduced)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue(mockClient);
    mockClient.query.mockResolvedValue({ rows: [] });
  });

  describe('1. Happy Path: Purchase → Credits Flow', () => {
    test('purchaseCredits should validate and create ledger entry', async () => {
      const mockLedgerResult = {
        rows: [{
          id: 123,
          delta: 15,
          created_at: new Date().toISOString(),
        }],
      };
      const mockSnapshotResult = { rows: [] };

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce(mockLedgerResult) // INSERT ledger
        .mockResolvedValueOnce(mockSnapshotResult) // INSERT/UPDATE snapshot
        .mockResolvedValueOnce({}); // COMMIT

      const result = await purchaseCredits(1, 15, {
        stripe_payment_intent_id: 'pi_test_123',
      });

      expect(result.success).toBe(true);
      expect(result.added_credits).toBe(15);
      expect(result.ledger_id).toBe(123);

      // Verify the ledger insert was called with correct params
      const ledgerCall = mockClient.query.mock.calls.find(
        call => call[0] && call[0].includes('INSERT INTO credit_ledger')
      );
      expect(ledgerCall).toBeDefined();
      expect(ledgerCall[1]).toEqual([1, 15, 'purchase_15', JSON.stringify({
        stripe_payment_intent_id: 'pi_test_123',
      }),]);
    });

    test('purchaseCredits should reject invalid amounts', async () => {
      mockClient.query.mockResolvedValueOnce({}); // BEGIN

      const resultNeg = await purchaseCredits(1, -5, {});
      expect(resultNeg.success).toBe(false);
      expect(resultNeg.error).toBe('INVALID_PACK');

      const resultZero = await purchaseCredits(1, 0, {});
      expect(resultZero.success).toBe(false);
      expect(resultZero.error).toBe('INVALID_PACK');
    });
  });

  describe('2. Credit Consumption Logic', () => {
    test('consumeCredits should check balance and create consumption entry', async () => {
      const userId = 1;
      const cost = 3;

      // Mock user exists
      const mockUserResult = { rows: [{ id: userId }] };
      // Mock balance check (sufficient credits)
      const mockBalanceResult = { rows: [{ new_balance: 12 }] };
      // Mock consumption insert
      const mockConsumptionResult = {
        rows: [{ id: 456, created_at: new Date().toISOString() }],
      };

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce(mockUserResult) // User check
        .mockResolvedValueOnce({}) // INSERT snapshot (if not exists)
        .mockResolvedValueOnce({ rows: [{ balance: 15 }] }) // FOR UPDATE lock
        .mockResolvedValueOnce({ rows: [{ // Balance breakdown
          free_credits: 0,
          purchased_credits: 15,
          subscription_credits: 0,
          consumed_credits: 0,
        }] })
        .mockResolvedValueOnce(mockConsumptionResult) // INSERT consumption
        .mockResolvedValueOnce({ rows: [{ new_balance: 12 }] }) // Get new balance
        .mockResolvedValueOnce({}) // UPDATE snapshot
        .mockResolvedValueOnce({}); // COMMIT

      const result = await consumeCredits(userId, cost, 'reading_123', {
        reading_type: 'TAROT_PREMIUM',
      });

      expect(result.success).toBe(true);
      expect(result.consumed).toBe(cost);
    });

    test('consumeCredits should return INSUFFICIENT_CREDITS when balance too low', async () => {
      const userId = 1;
      const cost = 10;

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: userId }] }) // User exists
        .mockResolvedValueOnce({}) // INSERT snapshot
        .mockResolvedValueOnce({ rows: [{ balance: 5 }] }) // FOR UPDATE
        .mockResolvedValueOnce({ rows: [{ // Balance breakdown - only 5 credits
          free_credits: 5,
          purchased_credits: 0,
          subscription_credits: 0,
          consumed_credits: 0,
        }] });

      const result = await consumeCredits(userId, cost, 'reading_123');

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('INSUFFICIENT_CREDITS');
      expect(result.available_balance).toBe(5);
      expect(result.required).toBe(cost);
    });
  });

  describe('3. Balance Calculation Logic', () => {
    test('getCreditBalance should query ledger and calculate breakdown', async () => {
      const userId = 1;

      mockQuery
        .mockResolvedValueOnce({ rows: [{ balance: 71 }] }) // Snapshot
        .mockResolvedValueOnce({
          rows: [{
            free_credits: 1,
            purchased_credits: 10,
            subscription_credits: 60,
            consumed_credits: -5,
            refunded_credits: 5,
          }],
        }) // Breakdown
        .mockResolvedValueOnce({ rows: [{ balance: 71 }] }) // Ledger balance
        .mockResolvedValueOnce({
          rows: [
            { source: 'purchase_15', total_delta: 15, count: 1 },
            { source: 'reading_consumption', total_delta: -5, count: 5 },
          ],
        }); // Summary

      const result = await getCreditBalance(userId);

      expect(result.balance).toBe(71);
      expect(result.breakdown.purchased).toBe(10);
      expect(result.breakdown.subscription).toBe(60);
      expect(result.breakdown.free).toBe(1);
      expect(result.breakdown.consumed).toBe(5);
      expect(result.ledger_summary).toHaveLength(2);
    });
  });

  describe('4. Free Credit Daily Refresh Logic', () => {
    test('issueFreeDailyCredits should check for existing daily credits', async () => {
      const userId = 1;

      // Mock: User already received credits today
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 789 }] }) // Found today's credit
        .mockResolvedValueOnce({}); // ROLLBACK

      const result = await issueFreeDailyCredits(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('ALREADY_ISSUED_TODAY');
    });

    test('issueFreeDailyCredits should issue credits if none today', async () => {
      const userId = 1;

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // No credits today
        .mockResolvedValueOnce({
          rows: [{
            id: 100,
            delta: 1,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }],
        }) // INSERT credit
        .mockResolvedValueOnce({}) // UPDATE snapshot
        .mockResolvedValueOnce({}); // COMMIT

      const result = await issueFreeDailyCredits(userId);

      expect(result.success).toBe(true);
      expect(result.added_credits).toBe(1);
    });
  });

  describe('5. Subscription Credits Logic', () => {
    test('issueSubscriptionCredits should create ledger entry', async () => {
      const userId = 1;
      const credits = 60;
      const tier = 'MYSTIC_LITE';

      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{
            id: 200,
            delta: credits,
            created_at: new Date().toISOString(),
          }],
        }) // INSERT
        .mockResolvedValueOnce({}) // UPDATE snapshot
        .mockResolvedValueOnce({}); // COMMIT

      const result = await issueSubscriptionCredits(userId, credits, tier, {
        subscription_id: 'sub_123',
      });

      expect(result.success).toBe(true);
      expect(result.added_credits).toBe(60);
      expect(result.ledger_id).toBe(200);

      // Verify correct source format
      const insertCall = mockClient.query.mock.calls.find(
        call => call[0] && call[0].includes('INSERT INTO credit_ledger')
      );
      expect(insertCall[1][2]).toBe('subscription_mystic_lite');
    });
  });

  describe('6. Admin Direct Credit Addition', () => {
    test('addCreditsDirectly should allow positive and negative amounts', async () => {
      // Test positive amount
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ id: 300, delta: 50, created_at: new Date().toISOString() }],
        })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const result = await addCreditsDirectly(1, 50, 'admin_adjustment');
      expect(result.success).toBe(true);
      expect(result.added_credits).toBe(50);

      // Reset mocks
      jest.clearAllMocks();
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ id: 301, delta: -10, created_at: new Date().toISOString() }],
        })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const resultNeg = await addCreditsDirectly(1, -10, 'admin_adjustment');
      expect(resultNeg.success).toBe(true);
      expect(resultNeg.added_credits).toBe(-10);
    });

    test('addCreditsDirectly should reject zero amount', async () => {
      mockClient.query.mockResolvedValueOnce({}); // BEGIN

      const result = await addCreditsDirectly(1, 0, 'admin_adjustment');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Amount cannot be zero');
    });
  });

  describe('7. Concurrent Consumption Protection', () => {
    test('consumeCredits uses FOR UPDATE locking to prevent race conditions', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // User exists
        .mockResolvedValueOnce({}) // INSERT snapshot
        .mockResolvedValueOnce({ rows: [{ balance: 10 }] }) // FOR UPDATE
        .mockResolvedValueOnce({ rows: [{ // Balance breakdown
          free_credits: 0,
          purchased_credits: 10,
          subscription_credits: 0,
          consumed_credits: 0,
        }] })
        .mockResolvedValueOnce({ rows: [{ id: 500, created_at: new Date().toISOString() }] })
        .mockResolvedValueOnce({ rows: [{ new_balance: 7 }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      await consumeCredits(1, 3, 'reading_1');

      // Verify FOR UPDATE was used
      const forUpdateCall = mockClient.query.mock.calls.find(
        call => call[0] && call[0].includes('FOR UPDATE')
      );
      expect(forUpdateCall).toBeDefined();
      expect(forUpdateCall[0]).toContain('SELECT balance FROM user_credit_snapshot');
    });
  });

  describe('8. Error Handling', () => {
    test('consumeCredits should handle database errors gracefully', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // User exists
        .mockResolvedValueOnce({}) // INSERT snapshot
        .mockRejectedValueOnce(new Error('Database connection lost'));

      const result = await consumeCredits(1, 5, 'reading_1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection lost');
    });

    test('purchaseCredits should rollback on error', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error('Insert failed'));

      const result = await purchaseCredits(1, 15, {});

      expect(result.success).toBe(false);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});
