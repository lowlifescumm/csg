const { addCredits, deductCredits, getUserCredits, initializeUserCreditsOnSignup } = require('../../lib/credits');
const { Pool } = require('pg');

// Mock pool
jest.mock('../../lib/db', () => {
  const mockPool = {
    query: jest.fn(),
  };
  return { pool: mockPool };
});

const { pool } = require('../../lib/db');

describe('Credits Management Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserCredits', () => {
    test('should return correct credit summary', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ paid_credits: '100', free_credits: '50' }],
      });

      const credits = await getUserCredits(1);
      
      expect(credits).toEqual({
        total: 150,
        paid: 100,
        free: 50,
      });
    });

    test('should handle no credits', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ paid_credits: null, free_credits: null }],
      });

      const credits = await getUserCredits(1);
      
      expect(credits).toEqual({
        total: 0,
        paid: 0,
        free: 0,
      });
    });
  });

  describe('addCredits', () => {
    test('should add credits to existing record', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ credits: 10 }] }) // Existing credits check
        .mockResolvedValueOnce(); // Update query

      const result = await addCredits(1, 5, 'free', 'test');

      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    test('should create new record if none exists', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // No existing credits
        .mockResolvedValueOnce(); // Insert query

      const result = await addCredits(1, 10, 'free', 'test');

      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('initializeUserCreditsOnSignup', () => {
    test('should initialize signup credits', async () => {
      pool.query
        .mockResolvedValueOnce() // addCredits insert
        .mockResolvedValueOnce() // Update last_free_credit_refresh
        .mockResolvedValueOnce(); // processReferral if referral code

      const result = await initializeUserCreditsOnSignup(1);

      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledTimes(2); // Skipping referral process
    });
  });

  describe('deductCredits', () => {
    test('should deduct credits from paid first', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [
            { id: 1, credits: 100, credit_type: 'paid' },
            { id: 2, credits: 50, credit_type: 'free' },
          ],
        })
        .mockResolvedValueOnce() // Update query
        .mockResolvedValueOnce(); // Cleanup query

      const result = await deductCredits(1, 50, true);

      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledTimes(3);
    });

    test('should not deduct free credits when not allowed', async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [
            { id: 1, credits: 0, credit_type: 'paid' },
            { id: 2, credits: 50, credit_type: 'free' },
          ],
        })
        .mockResolvedValueOnce(); // Cleanup query

      const result = await deductCredits(1, 10, false);

      expect(result).toBe(false); // Not enough paid credits and can't use free
      expect(pool.query).toHaveBeenCalledTimes(2);
    });
  });
});



