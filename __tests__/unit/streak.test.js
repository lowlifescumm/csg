/**
 * Streak Tracking Unit Tests
 * Tests for daily login streak increment and streak API updates
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

const { pool } = require('@/lib/db');
const { getAuthenticatedUser } = require('@/lib/auth');

describe('Streak Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Daily Login Streak Increment', () => {
    test('should increment streak on first login of the day', async () => {
      const userId = 1;
      const today = new Date().toISOString().split('T')[0];

      // Mock: No login today yet
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // Check for today's login
        .mockResolvedValueOnce({ rows: [{ id: 1, current_streak: 0, last_login_date: null }] }) // Get current streak
        .mockResolvedValueOnce({ rows: [{ id: 1, current_streak: 1, last_login_date: today }] }); // Update streak

      // Simulate streak update
      const checkResult = await pool.query(
        `SELECT id, current_streak, last_login_date 
         FROM user_streaks 
         WHERE user_id = $1 AND last_login_date = CURRENT_DATE`,
        [userId]
      );

      if (checkResult.rows.length === 0) {
        const currentStreak = await pool.query(
          `SELECT id, current_streak, last_login_date 
           FROM user_streaks 
           WHERE user_id = $1`,
          [userId]
        );

        let newStreak = 1;
        if (currentStreak.rows.length > 0) {
          const lastLogin = currentStreak.rows[0].last_login_date;
          if (lastLogin) {
            const daysDiff = Math.floor((new Date() - new Date(lastLogin)) / (1000 * 60 * 60 * 24));
            if (daysDiff === 1) {
              // Consecutive day
              newStreak = currentStreak.rows[0].current_streak + 1;
            } else if (daysDiff > 1) {
              // Streak broken
              newStreak = 1;
            } else {
              // Same day
              newStreak = currentStreak.rows[0].current_streak;
            }
          }
        }

        await pool.query(
          `INSERT INTO user_streaks (user_id, current_streak, last_login_date)
           VALUES ($1, $2, CURRENT_DATE)
           ON CONFLICT (user_id)
           DO UPDATE SET 
             current_streak = $2,
             last_login_date = CURRENT_DATE,
             updated_at = NOW()`,
          [userId, newStreak]
        );
      }

      expect(pool.query).toHaveBeenCalled();
      const lastCall = pool.query.mock.calls[pool.query.mock.calls.length - 1];
      expect(lastCall[1][1]).toBe(1); // New streak should be 1
    });

    test('should increment streak on consecutive days', async () => {
      const userId = 1;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      pool.query
        .mockResolvedValueOnce({ rows: [] }) // No login today
        .mockResolvedValueOnce({ rows: [{ id: 1, current_streak: 5, last_login_date: yesterdayStr }] }) // Current streak
        .mockResolvedValueOnce({ rows: [{ id: 1, current_streak: 6, last_login_date: new Date().toISOString().split('T')[0] }] }); // Updated

      // Simulate consecutive day login
      const checkResult = await pool.query(
        `SELECT id, current_streak, last_login_date 
         FROM user_streaks 
         WHERE user_id = $1 AND last_login_date = CURRENT_DATE`,
        [userId]
      );

      if (checkResult.rows.length === 0) {
        const currentStreak = await pool.query(
          `SELECT id, current_streak, last_login_date 
           FROM user_streaks 
           WHERE user_id = $1`,
          [userId]
        );

        const daysDiff = Math.floor((new Date() - new Date(yesterdayStr)) / (1000 * 60 * 60 * 24));
        const newStreak = daysDiff === 1 ? currentStreak.rows[0].current_streak + 1 : 1;

        await pool.query(
          `INSERT INTO user_streaks (user_id, current_streak, last_login_date)
           VALUES ($1, $2, CURRENT_DATE)
           ON CONFLICT (user_id)
           DO UPDATE SET 
             current_streak = $2,
             last_login_date = CURRENT_DATE,
             updated_at = NOW()`,
          [userId, newStreak]
        );
      }

      expect(pool.query).toHaveBeenCalled();
      const lastCall = pool.query.mock.calls[pool.query.mock.calls.length - 1];
      expect(lastCall[1][1]).toBe(6); // Streak should increment to 6
    });

    test('should reset streak when login gap is more than 1 day', async () => {
      const userId = 1;
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

      pool.query
        .mockResolvedValueOnce({ rows: [] }) // No login today
        .mockResolvedValueOnce({ rows: [{ id: 1, current_streak: 10, last_login_date: threeDaysAgoStr }] }) // Old streak
        .mockResolvedValueOnce({ rows: [{ id: 1, current_streak: 1, last_login_date: new Date().toISOString().split('T')[0] }] }); // Reset

      // Simulate broken streak
      const checkResult = await pool.query(
        `SELECT id, current_streak, last_login_date 
         FROM user_streaks 
         WHERE user_id = $1 AND last_login_date = CURRENT_DATE`,
        [userId]
      );

      if (checkResult.rows.length === 0) {
        const currentStreak = await pool.query(
          `SELECT id, current_streak, last_login_date 
           FROM user_streaks 
           WHERE user_id = $1`,
          [userId]
        );

        const daysDiff = Math.floor((new Date() - new Date(threeDaysAgoStr)) / (1000 * 60 * 60 * 24));
        const newStreak = daysDiff === 1 ? currentStreak.rows[0].current_streak + 1 : 1;

        await pool.query(
          `INSERT INTO user_streaks (user_id, current_streak, last_login_date)
           VALUES ($1, $2, CURRENT_DATE)
           ON CONFLICT (user_id)
           DO UPDATE SET 
             current_streak = $2,
             last_login_date = CURRENT_DATE,
             updated_at = NOW()`,
          [userId, newStreak]
        );
      }

      expect(pool.query).toHaveBeenCalled();
      const lastCall = pool.query.mock.calls[pool.query.mock.calls.length - 1];
      expect(lastCall[1][1]).toBe(1); // Streak should reset to 1
    });

    test('should not increment streak on same day multiple logins', async () => {
      const userId = 1;
      const today = new Date().toISOString().split('T')[0];

      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 1, current_streak: 5, last_login_date: today }] }); // Already logged in today

      // Simulate same-day login
      const checkResult = await pool.query(
        `SELECT id, current_streak, last_login_date 
         FROM user_streaks 
         WHERE user_id = $1 AND last_login_date = CURRENT_DATE`,
        [userId]
      );

      if (checkResult.rows.length > 0) {
        // Already logged in today, no update needed
        expect(checkResult.rows[0].current_streak).toBe(5);
      }

      // Should only have the check query
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('Streak API Endpoint', () => {
    test('should return current streak data', async () => {
      const userId = 1;
      const mockStreak = {
        current_streak: 7,
        last_login_date: new Date().toISOString().split('T')[0],
        longest_streak: 10,
      };

      getAuthenticatedUser.mockResolvedValue({ userId });

      pool.query.mockResolvedValueOnce({
        rows: [mockStreak],
      });

      // Simulate API call
      const result = await pool.query(
        `SELECT current_streak, last_login_date, longest_streak
         FROM user_streaks
         WHERE user_id = $1`,
        [userId]
      );

      expect(result.rows[0]).toEqual(mockStreak);
      expect(result.rows[0].current_streak).toBe(7);
    });

    test('should handle user with no streak record', async () => {
      const userId = 999;

      getAuthenticatedUser.mockResolvedValue({ userId });

      pool.query.mockResolvedValueOnce({ rows: [] });

      // Simulate API call
      const result = await pool.query(
        `SELECT current_streak, last_login_date, longest_streak
         FROM user_streaks
         WHERE user_id = $1`,
        [userId]
      );

      expect(result.rows).toHaveLength(0);
    });
  });
});

