/**
 * Access Control Logic Tests - Scope Reduced for GSTA-534
 * Tests access control logic WITHOUT requiring PostgreSQL
 * Mocks the database layer to verify business logic is sound
 */

// Mock the pg Pool
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

// Mock db
jest.mock('../../lib/db.js', () => ({
  pool: {
    query: mockQuery,
    connect: mockConnect,
  },
}));

// Mock credit-engine
const mockConsumeCredits = jest.fn();
const mockGetCreditBalance = jest.fn();
jest.mock('../../lib/credit-engine.js', () => ({
  consumeCredits: mockConsumeCredits,
  getCreditBalance: mockGetCreditBalance,
}));

// Mock credits.js (legacy)
const mockHasEnoughCredits = jest.fn();
const mockDeductCredits = jest.fn();
jest.mock('../../lib/credits.js', () => ({
  hasEnoughCredits: mockHasEnoughCredits,
  deductCredits: mockDeductCredits,
}));

const {
  hasActiveSubscription,
  canAccessReading,
  consumeCreditsForReading,
  canUseFreeCredits,
  claimFreeNatalChart,
} = require('../../lib/access-control');

describe('Access Control - Logic Verification (Scope Reduced)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
    mockConsumeCredits.mockReset();
    mockGetCreditBalance.mockReset();
  });

  describe('1. Admin Bypass Logic', () => {
    test('admin users should bypass all credit checks', async () => {
      const adminUserId = 'admin-123';

      // Mock admin user query
      mockQuery.mockResolvedValueOnce({
        rows: [{ role: 'admin' }],
      });

      const result = await canAccessReading(adminUserId, 'TAROT_PREMIUM');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('admin_access');
      expect(result.cost).toBe(0);
    });

    test('admin should bypass credit consumption', async () => {
      const adminUserId = 'admin-123';

      // Mock admin user query
      mockQuery.mockResolvedValueOnce({
        rows: [{ role: 'admin' }],
      });

      const result = await consumeCreditsForReading(adminUserId, 'TAROT_PREMIUM', 'reading-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('admin_access');
      expect(result.cost).toBe(0);
      expect(mockConsumeCredits).not.toHaveBeenCalled();
    });
  });

  describe('2. Free Reading Types', () => {
    test('DAILY_HOROSCOPE should always be free', async () => {
      const userId = 'user-123';

      // Only role query should run
      mockQuery.mockResolvedValueOnce({
        rows: [{ role: 'user' }],
      });

      const result = await canAccessReading(userId, 'DAILY_HOROSCOPE');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('always_free');
      expect(result.cost).toBe(0);
      expect(mockQuery).toHaveBeenCalledTimes(1); // Only role check
    });

    test('DAILY_HOROSCOPE consumption should not deduct credits', async () => {
      const userId = 'user-123';

      mockQuery.mockResolvedValueOnce({
        rows: [{ role: 'user' }],
      });

      const result = await consumeCreditsForReading(userId, 'DAILY_HOROSCOPE', 'reading-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('reading_is_free');
      expect(result.cost).toBe(0);
      expect(mockConsumeCredits).not.toHaveBeenCalled();
    });
  });

  describe('3. Subscription Transit Features', () => {
    test('transit features should be free for subscribers', async () => {
      const userId = 'user-123';

      // First query: role, Second: subscription check
      mockQuery
        .mockResolvedValueOnce({ rows: [{ role: 'user' }] })
        .mockResolvedValueOnce({ rows: [{ stripe_subscription_id: 'sub_123' }] });

      const result = await canAccessReading(userId, 'NATAL_CHART');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('subscription_included');
      expect(result.cost).toBe(0);
    });

    test('transit features should require credits for non-subscribers', async () => {
      const userId = 'user-123';

      mockQuery
        .mockResolvedValueOnce({ rows: [{ role: 'user' }] })
        .mockResolvedValueOnce({ rows: [{ stripe_subscription_id: null }] });

      mockGetCreditBalance.mockResolvedValueOnce({
        balance: 10,
        breakdown: { purchased: 10, free: 0, subscription: 0 },
      });

      // Mock canUseFreeCredits - return false for NATAL_CHART
      // Note: In real code, NATAL_CHART would need to check via canUseFreeCredits
      // which queries credit_ledger. We'll mock this behavior
      mockQuery.mockResolvedValueOnce({
        rows: [{ free_issued: 0 }],
      });

      const result = await canAccessReading(userId, 'NATAL_CHART');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('has_credits');
      expect(result.cost).toBeGreaterThan(0);
    });
  });

  describe('4. Credit-Based Access Control', () => {
    test('should allow access when user has sufficient credits', async () => {
      const userId = 'user-123';

      mockQuery
        .mockResolvedValueOnce({ rows: [{ role: 'user' }] })
        .mockResolvedValueOnce({ rows: [{ stripe_subscription_id: null }] });

      mockGetCreditBalance.mockResolvedValueOnce({
        balance: 50,
        breakdown: { purchased: 50, free: 0, subscription: 0 },
      });

      // Mock canUseFreeCredits check (returns false for non-free-eligible reading)
      mockQuery.mockResolvedValueOnce({ rows: [{ free_issued: 0 }] });

      const result = await canAccessReading(userId, 'TAROT_PREMIUM');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('has_credits');
      expect(result.cost).toBe(3); // TAROT_PREMIUM costs 3
    });

    test('should deny access when insufficient credits', async () => {
      const userId = 'user-123';

      mockQuery
        .mockResolvedValueOnce({ rows: [{ role: 'user' }] })
        .mockResolvedValueOnce({ rows: [{ stripe_subscription_id: null }] });

      mockGetCreditBalance.mockResolvedValueOnce({
        balance: 1,
        breakdown: { purchased: 1, free: 0, subscription: 0 },
      });

      // Mock canUseFreeCredits check
      mockQuery.mockResolvedValueOnce({ rows: [{ free_issued: 0 }] });

      const result = await canAccessReading(userId, 'MOON_READING');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('insufficient_credits');
      expect(result.required).toBe(5); // MOON_READING costs 5
    });
  });

  describe('5. Credit Consumption Flow', () => {
    test('should consume credits successfully', async () => {
      const userId = 'user-123';

      mockQuery.mockResolvedValueOnce({
        rows: [{ role: 'user' }],
      });

      mockQuery.mockResolvedValueOnce({
        rows: [{ stripe_subscription_id: null }],
      });

      // Mock canUseFreeCredits check in consumeCreditsForReading
      mockQuery.mockResolvedValueOnce({ rows: [{ free_issued: 0 }] });

      mockConsumeCredits.mockResolvedValueOnce({
        success: true,
        new_balance: 12,
        consumed: 3,
      });

      const result = await consumeCreditsForReading(userId, 'TAROT_PREMIUM', 'reading-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('credits_deducted');
      expect(result.new_balance).toBe(12);
      expect(mockConsumeCredits).toHaveBeenCalledWith(
        userId,
        3, // TAROT_PREMIUM cost
        'reading-1',
        expect.objectContaining({
          reading_type: 'TAROT_PREMIUM',
          can_use_free: expect.any(Boolean),
        })
      );
    });

    test('should handle INSUFFICIENT_CREDITS error', async () => {
      const userId = 'user-123';

      mockQuery
        .mockResolvedValueOnce({ rows: [{ role: 'user' }] })
        .mockResolvedValueOnce({ rows: [{ stripe_subscription_id: null }] });

      // Mock canUseFreeCredits check
      mockQuery.mockResolvedValueOnce({ rows: [{ free_issued: 0 }] });

      mockConsumeCredits.mockResolvedValueOnce({
        success: false,
        error_code: 'INSUFFICIENT_CREDITS',
        available_balance: 1,
        required: 3,
        error: 'Insufficient credits',
      });

      const result = await consumeCreditsForReading(userId, 'TAROT_PREMIUM', 'reading-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('insufficient_credits');
      expect(result.available_balance).toBe(1);
      expect(result.required).toBe(3);
    });
  });

  describe('6. Free Credit Eligibility', () => {
    test('canUseFreeCredits should return true for TAROT_BASIC', async () => {
      const userId = 'user-123';

      // Mock: User has received 0 free credits so far
      mockQuery.mockResolvedValueOnce({
        rows: [{ free_issued: 0 }],
      });

      const result = await canUseFreeCredits(userId, 'TAROT_BASIC');

      expect(result).toBe(true);
    });

    test('canUseFreeCredits should return false after 5 free credits', async () => {
      const userId = 'user-123';

      // Mock: User has already received 5 free credits (lifetime limit)
      mockQuery.mockResolvedValueOnce({
        rows: [{ free_issued: 5 }],
      });

      const result = await canUseFreeCredits(userId, 'TAROT_BASIC');

      expect(result).toBe(false);
    });

    test('canUseFreeCredits should return true for TAROT_CUSTOM with 1 card', async () => {
      const userId = 'user-123';

      mockQuery.mockResolvedValueOnce({
        rows: [{ free_issued: 2 }],
      });

      const result = await canUseFreeCredits(userId, 'TAROT_CUSTOM', 1);

      expect(result).toBe(true);
    });

    test('canUseFreeCredits should return false for TAROT_CUSTOM with 3 cards', async () => {
      const userId = 'user-123';

      // Even with < 5 lifetime free credits, multi-card custom spreads don't qualify
      mockQuery.mockResolvedValueOnce({
        rows: [{ free_issued: 2 }],
      });

      const result = await canUseFreeCredits(userId, 'TAROT_CUSTOM', 3);

      expect(result).toBe(false);
    });

    test('canUseFreeCredits should return false for premium reading types', async () => {
      const userId = 'user-123';

      mockQuery.mockResolvedValueOnce({
        rows: [{ free_issued: 0 }],
      });

      const result = await canUseFreeCredits(userId, 'TAROT_PREMIUM');

      expect(result).toBe(false);
    });
  });

  describe('7. Subscription Status Check', () => {
    test('hasActiveSubscription should return true with subscription', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ stripe_subscription_id: 'sub_123' }],
      });

      const result = await hasActiveSubscription('user-123');

      expect(result).toBe(true);
    });

    test('hasActiveSubscription should return false without subscription', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ stripe_subscription_id: null }],
      });

      const result = await hasActiveSubscription('user-123');

      expect(result).toBe(false);
    });

    test('hasActiveSubscription should handle errors gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));

      const result = await hasActiveSubscription('user-123');

      expect(result).toBe(false);
    });
  });

  describe('8. Free Natal Chart Claim', () => {
    test('claimFreeNatalChart should mark as claimed', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ free_natal_chart_used: false }] })
        .mockResolvedValueOnce({});

      const result = await claimFreeNatalChart('user-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('natal_chart_claimed');
    });

    test('claimFreeNatalChart should reject if already claimed', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ free_natal_chart_used: true }],
      });

      const result = await claimFreeNatalChart('user-123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('already_claimed');
    });
  });

  describe('9. Custom Spread Card Count', () => {
    test('TAROT_CUSTOM cost equals card count', async () => {
      const userId = 'user-123';

      mockQuery
        .mockResolvedValueOnce({ rows: [{ role: 'user' }] })
        .mockResolvedValueOnce({ rows: [{ stripe_subscription_id: null }] });

      mockGetCreditBalance.mockResolvedValueOnce({
        balance: 20,
        breakdown: { purchased: 20, free: 0, subscription: 0 },
      });

      // canUseFreeCredits check for 5-card spread
      mockQuery.mockResolvedValueOnce({ rows: [{ free_issued: 0 }] });

      const result = await canAccessReading(userId, 'TAROT_CUSTOM', 5);

      expect(result.allowed).toBe(true);
      expect(result.cost).toBe(5); // 5 cards = 5 credits
    });

    test('TAROT_CUSTOM with 10 cards costs 10 credits', async () => {
      const userId = 'user-123';

      mockQuery
        .mockResolvedValueOnce({ rows: [{ role: 'user' }] })
        .mockResolvedValueOnce({ rows: [{ stripe_subscription_id: null }] });

      mockGetCreditBalance.mockResolvedValueOnce({
        balance: 20,
        breakdown: { purchased: 20, free: 0, subscription: 0 },
      });

      mockQuery.mockResolvedValueOnce({ rows: [{ free_issued: 0 }] });

      const result = await canAccessReading(userId, 'TAROT_CUSTOM', 10);

      expect(result.allowed).toBe(true);
      expect(result.cost).toBe(10);
    });
  });

  describe('10. Error Handling', () => {
    test('should handle credit engine failures', async () => {
      const userId = 'user-123';

      mockQuery
        .mockResolvedValueOnce({ rows: [{ role: 'user' }] })
        .mockResolvedValueOnce({ rows: [{ stripe_subscription_id: null }] });

      // canUseFreeCredits check
      mockQuery.mockResolvedValueOnce({ rows: [{ free_issued: 0 }] });

      mockConsumeCredits.mockResolvedValueOnce({
        success: false,
        error_code: 'USER_NOT_FOUND',
        error: 'User not found',
      });

      const result = await consumeCreditsForReading(userId, 'TAROT_PREMIUM', 'reading-1');

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('USER_NOT_FOUND');
    });

    test('should handle missing user in database', async () => {
      // Mock empty rows (user not found)
      mockQuery.mockResolvedValueOnce({
        rows: [],
      });

      // This will throw because userRows[0] is undefined
      // This is a KNOWN BUG: access-control.js doesn't handle missing users gracefully
      // The credit-engine.js properly handles this in consumeCredits
      // But access-control.js queries user separately and doesn't check if rows[0] exists

      // For now, expect an error (documenting the bug)
      await expect(consumeCreditsForReading('nonexistent', 'TAROT_BASIC', 'reading-1'))
        .rejects.toThrow();
    });
  });
});
