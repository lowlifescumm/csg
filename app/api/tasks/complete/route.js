import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { authOptions } from '@/lib/auth-config';
import { pool } from "@/lib/db";
import { getLocalDateString } from '@/lib/date-utils';
import logger from '@/lib/logger';

export const runtime = "nodejs";

// Task definitions matching the frontend
const TASK_DEFINITIONS = {
  "three-card-spread": { xpReward: 10, creditReward: 0 },
  "sync-moon-phase": { xpReward: 5, creditReward: 0 },
  "check-compatibility": { xpReward: 5, creditReward: 0 },
  // Meditation task temporarily hidden
  // "meditation-session": { xpReward: 5, creditReward: 1 }, // Occasionally
};

/**
 * Calculate streak bonus XP
 */
function calculateStreakBonus(currentStreak) {
  if (currentStreak === 0) return 0;
  if (currentStreak < 7) return 0;
  if (currentStreak < 14) return 5; // 7+ days
  if (currentStreak < 30) return 10; // 14+ days
  if (currentStreak < 60) return 15; // 30+ days
  return 20; // 60+ days
}

/**
 * POST /api/tasks/complete
 * Mark a task as completed and award XP/credits
 * 
 * Body:
 * - taskId: ID of the completed task
 * - userId: User ID (optional, will use authenticated user)
 */
export async function POST(request) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);

    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = authResult;
    const body = await request.json();
    const { taskId, timezone } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const task = TASK_DEFINITIONS[taskId];
    if (!task) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const today = getLocalDateString(timezone);

    // Check if task already completed today
    const existingResult = await pool.query(
      `SELECT id FROM user_tasks 
       WHERE user_id = $1 AND task_id = $2 AND completed_date = $3`,
      [userId, taskId, today]
    );

    if (existingResult.rows.length > 0) {
      return NextResponse.json({
        error: "Task already completed today",
      }, { status: 400 });
    }

    // Get user's streak (calculate from task completions)
    let currentStreak = 0;
    try {
      // Get distinct dates with task completions, ordered by date descending
      const recentTasks = await pool.query(
        `SELECT DISTINCT to_char(completed_date, 'YYYY-MM-DD') as completed_date
         FROM user_tasks
         WHERE user_id = $1
         AND completed_date <= $2
         ORDER BY completed_date DESC
         LIMIT 60`,
        [userId, today]
      );
      
      if (recentTasks.rows.length > 0) {
        const todayDate = new Date(today + 'T00:00:00Z');

        let consecutiveDays = 0;
        let expectedDay = 0; // 0 = today, 1 = yesterday, etc.

        for (const row of recentTasks.rows) {
          const taskDateStr = row.completed_date;
          const taskDate = new Date(taskDateStr + 'T00:00:00Z');

          const daysAgo = Math.floor((todayDate - taskDate) / (1000 * 60 * 60 * 24));

          // Check if this date matches the expected consecutive day
          if (daysAgo === expectedDay) {
            consecutiveDays++;
            expectedDay++;
          } else if (daysAgo > expectedDay) {
            // Gap found, streak is broken
            break;
          }
          // If daysAgo < expectedDay, skip (shouldn't happen with DESC order)
        }

        currentStreak = consecutiveDays;
      }
    } catch (err) {
      // If streak calculation fails, continue without bonus
      logger.info("Could not calculate streak:", err);
    }

    // Calculate rewards
    const streakBonus = calculateStreakBonus(currentStreak);
    const xpEarned = task.xpReward + streakBonus;
    const creditEarned = task.creditReward;

    // Record task completion
    await pool.query(
      `INSERT INTO user_tasks (user_id, task_id, completed_date, xp_earned, credit_earned, streak_bonus)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, task_id, completed_date) DO NOTHING`,
      [userId, taskId, today, xpEarned, creditEarned, streakBonus]
    );

    // Update user XP - ensure table exists first
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_xp (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          total_xp INTEGER DEFAULT 0,
          current_level INTEGER DEFAULT 1,
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_user_xp_user_id ON user_xp(user_id)
      `);
    } catch (createError) {
      logger.info("XP table creation (if needed):", createError.message);
    }

    // Update user XP - use COALESCE to handle NULL values properly
    const xpResult = await pool.query(
      `INSERT INTO user_xp (user_id, total_xp, current_level)
       VALUES ($1, $2, 1)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         total_xp = COALESCE(user_xp.total_xp, 0) + $2,
         current_level = FLOOR((COALESCE(user_xp.total_xp, 0) + $2) / 100) + 1,
         updated_at = NOW()
       RETURNING total_xp, current_level`,
      [userId, xpEarned]
    );

    if (!xpResult.rows || xpResult.rows.length === 0) {
      logger.error("XP update failed: No rows returned");
      throw new Error("Failed to update XP - no rows returned");
    }

    const newTotalXP = xpResult.rows[0].total_xp;
    const newLevel = xpResult.rows[0].current_level;
    
    logger.info(`[Task Complete] User ${userId} earned ${xpEarned} XP. New total: ${newTotalXP}, New level: ${newLevel}`);

    // Award credits if applicable (occasionally for meditation)
    let actualCreditEarned = 0;
    if (creditEarned > 0) {
      // Random chance: 30% chance to get credit
      const shouldAwardCredit = Math.random() < 0.3;
      
      if (shouldAwardCredit) {
        try {
          await pool.query(
            `INSERT INTO credits (user_id, credits)
             VALUES ($1, $2)
             ON CONFLICT (user_id) 
             DO UPDATE SET credits = credits.credits + $2`,
            [userId, creditEarned]
          );
          actualCreditEarned = creditEarned;
        } catch (creditError) {
          logger.error("Error awarding credit:", creditError);
          // Don't fail the task completion if credit award fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      xpEarned,
      creditEarned: actualCreditEarned,
      streakBonus,
      totalXP: newTotalXP,
      level: newLevel,
    });
  } catch (error) {
    logger.error("Complete task error:", error);
    return NextResponse.json(
      { error: "Failed to complete task", details: error.message },
      { status: 500 }
    );
  }
}

