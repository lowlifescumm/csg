import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { authOptions } from '@/lib/auth-config';
import { pool } from "@/lib/db";
import { getLocalDateString } from '@/lib/date-utils';
import logger from '@/lib/logger';

export const runtime = "nodejs";

/**
 * GET /api/tasks
 * Returns user's daily tasks and completion status
 */
export async function GET(request) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);

    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get('timezone');
    const today = getLocalDateString(timezone);

    // Check if tasks table exists, if not create it
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_tasks (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          task_id VARCHAR(100) NOT NULL,
          completed_date DATE NOT NULL,
          xp_earned INTEGER DEFAULT 0,
          credit_earned INTEGER DEFAULT 0,
          streak_bonus INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, task_id, completed_date)
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_tasks_date ON user_tasks(completed_date);
      `);
    } catch (createError) {
      // Table might already exist, continue
      logger.info("Tasks table creation:", createError.message);
    }

    // Check if user_xp table exists, if not create it
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
        CREATE INDEX IF NOT EXISTS idx_user_xp_user_id ON user_xp(user_id);
      `);
    } catch (createError) {
      logger.info("XP table creation:", createError.message);
    }

    // Get today's completed tasks
    const completedResult = await pool.query(
      `SELECT task_id FROM user_tasks 
       WHERE user_id = $1 AND completed_date = $2`,
      [userId, today]
    );

    const completedTasks = completedResult.rows.map((row) => row.task_id);

    // Get user's XP stats
    const xpResult = await pool.query(
      `SELECT total_xp, current_level FROM user_xp WHERE user_id = $1`,
      [userId]
    );

    let totalXP = 0;
    let currentLevel = 1;

    if (xpResult.rows.length > 0) {
      totalXP = xpResult.rows[0].total_xp || 0;
      currentLevel = xpResult.rows[0].current_level || 1;
    } else {
      // Initialize XP for new user
      await pool.query(
        `INSERT INTO user_xp (user_id, total_xp, current_level) VALUES ($1, 0, 1)`,
        [userId]
      );
    }

    return NextResponse.json({
      success: true,
      completedTasks,
      stats: {
        totalXP,
        level: currentLevel,
        xpToNextLevel: 100 - (totalXP % 100),
      },
    });
  } catch (error) {
    logger.error("Get tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks", details: error.message },
      { status: 500 }
    );
  }
}

