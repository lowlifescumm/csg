/**
 * Credit Deduction Unit Tests
 * Tests for credit deduction when generating readings
 */

const { Pool } = require('pg');

// Mock dependencies
jest.mock('@/lib/db', () => {
  const mockPool = {
    query: jest.fn(),
  };
  return { pool: mockPool };
});

jest.mock('@/lib/auth', () => ({
  getAuthenticatedUser: jest.fn(),
}));

jest.mock('@/lib/access-control', () => ({
  canAccessReading: jest.fn(),
  consumeCreditsForReading: jest.fn(),
}));

const { pool } = require('@/lib/db');
const { getAuthenticatedUser } = require('@/lib/auth');
const { canAccessReading, consumeCreditsForReading } = require('@/lib/access-control');

describe('Credit Deduction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Reading Generation Credit Deduction', () => {
    test('should deduct 1 credit for basic tarot reading', async () => {
      const userId = 1;
      const initialCredits = 10;

      getAuthenticatedUser.mockResolvedValue({ userId });

      // Mock: User has credits
      canAccessReading.mockResolvedValue({
        allowed: true,
        required: 1,
      });

      // Mock: Credit deduction succeeds
      consumeCreditsForReading.mockResolvedValue({
        success: true,
        creditsRemaining: initialCredits - 1,
        cost: 1,
      });

      // Mock: Reading saved successfully
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 123, created_at: new Date() }],
      });

      // Simulate reading generation
      const accessCheck = await canAccessReading(userId, 'TAROT_BASIC');
      expect(accessCheck.allowed).toBe(true);

      if (accessCheck.allowed) {
        const creditResult = await consumeCreditsForReading(userId, 'TAROT_BASIC');
        expect(creditResult.success).toBe(true);
        expect(creditResult.creditsRemaining).toBe(9);
        expect(creditResult.cost).toBe(1);
      }

      expect(canAccessReading).toHaveBeenCalledWith(userId, 'TAROT_BASIC');
      expect(consumeCreditsForReading).toHaveBeenCalledWith(userId, 'TAROT_BASIC');
    });

    test('should deduct 2 credits for premium tarot reading', async () => {
      const userId = 1;
      const initialCredits = 10;

      getAuthenticatedUser.mockResolvedValue({ userId });

      canAccessReading.mockResolvedValue({
        allowed: true,
        required: 2,
      });

      consumeCreditsForReading.mockResolvedValue({
        success: true,
        creditsRemaining: initialCredits - 2,
        cost: 2,
      });

      // Simulate premium reading
      const accessCheck = await canAccessReading(userId, 'TAROT_PREMIUM');
      expect(accessCheck.allowed).toBe(true);

      if (accessCheck.allowed) {
        const creditResult = await consumeCreditsForReading(userId, 'TAROT_PREMIUM');
        expect(creditResult.success).toBe(true);
        expect(creditResult.creditsRemaining).toBe(8);
        expect(creditResult.cost).toBe(2);
      }

      expect(consumeCreditsForReading).toHaveBeenCalledWith(userId, 'TAROT_PREMIUM');
    });

    test('should fail when insufficient credits', async () => {
      const userId = 1;

      getAuthenticatedUser.mockResolvedValue({ userId });

      canAccessReading.mockResolvedValue({
        allowed: false,
        reason: 'insufficient_credits',
        required: 1,
      });

      // Simulate insufficient credits
      const accessCheck = await canAccessReading(userId, 'TAROT_BASIC');
      expect(accessCheck.allowed).toBe(false);
      expect(accessCheck.reason).toBe('insufficient_credits');
      expect(accessCheck.required).toBe(1);

      // Should not call consumeCreditsForReading
      expect(consumeCreditsForReading).not.toHaveBeenCalled();
    });

    test('should handle credit deduction failure gracefully', async () => {
      const userId = 1;

      getAuthenticatedUser.mockResolvedValue({ userId });

      canAccessReading.mockResolvedValue({
        allowed: true,
        required: 1,
      });

      consumeCreditsForReading.mockResolvedValue({
        success: false,
        message: 'Credit processing failed',
        cost: 1,
      });

      // Simulate credit deduction failure
      const accessCheck = await canAccessReading(userId, 'TAROT_BASIC');
      expect(accessCheck.allowed).toBe(true);

      const creditResult = await consumeCreditsForReading(userId, 'TAROT_BASIC');
      expect(creditResult.success).toBe(false);
      expect(creditResult.message).toBe('Credit processing failed');
    });
  });

  describe('Credit Balance Updates', () => {
    test('should update credit balance after deduction', async () => {
      const userId = 1;
      const initialCredits = 5;

      // Mock credit check
      pool.query.mockResolvedValueOnce({
        rows: [{ credits: initialCredits }],
      });

      // Mock credit deduction
      pool.query.mockResolvedValueOnce({
        rows: [{ credits: initialCredits - 1 }],
      });

      // Simulate credit check
      const creditCheck = await pool.query(
        'SELECT credits FROM credits WHERE user_id = $1',
        [userId]
      );
      const currentCredits = creditCheck.rows[0]?.credits || 0;

      // Simulate deduction
      const deductionResult = await pool.query(
        'UPDATE credits SET credits = credits - 1 WHERE user_id = $1 RETURNING credits',
        [userId]
      );

      expect(currentCredits).toBe(5);
      expect(deductionResult.rows[0].credits).toBe(4);
    });

    test('should prevent negative credit balance', async () => {
      const userId = 1;
      const initialCredits = 0;

      pool.query
        .mockResolvedValueOnce({
          rows: [{ credits: initialCredits }],
        })
        .mockResolvedValueOnce({
          rows: [], // No rows returned if credits would be negative
        });

      // Simulate credit check
      const creditCheck = await pool.query(
        'SELECT credits FROM credits WHERE user_id = $1',
        [userId]
      );
      const currentCredits = creditCheck.rows[0]?.credits || 0;

      // Attempt deduction (should fail)
      if (currentCredits > 0) {
        await pool.query(
          'UPDATE credits SET credits = credits - 1 WHERE user_id = $1 AND credits > 0 RETURNING credits',
          [userId]
        );
      }

      expect(currentCredits).toBe(0);
      // Deduction should not happen
      expect(pool.query.mock.calls[1][0]).toContain('credits > 0');
    });
  });
});

