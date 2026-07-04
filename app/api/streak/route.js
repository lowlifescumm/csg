import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/db';
import { getLocalDateString, getLocalDateOffset } from '@/lib/date-utils';
import logger from '@/lib/logger';
import { MILESTONE_DEFINITIONS } from '@/lib/streak-milestones';

/**
 * Collect distinct activity dates for a user from multiple engagement tables.
 * Gracefully handles tables that may not exist yet (lazy-created in some routes).
 */
async function getActivityDates(userId, timezone) {
  const activityDates = new Set();

  // Helper to safely query a table and collect date strings
  const safeQuery = async (sql, params, dateField = 'activity_date') => {
    try {
      const { rows } = await pool.query(sql, params);
      rows.forEach(row => activityDates.add(row[dateField]));
    } catch (err) {
      // Table likely doesn't exist yet; ignore silently
      logger.debug(`Streak query skipped for table: ${err.message}`);
    }
  };

  // 1. Readings (tarot, horoscope, etc.) — base table, always exists
  await safeQuery(
    `SELECT DISTINCT to_char((created_at::timestamptz AT TIME ZONE $2)::date, 'YYYY-MM-DD') as activity_date
     FROM readings
     WHERE user_id=$1
     ORDER BY activity_date DESC
     LIMIT 30`,
    [userId, timezone]
  );

  // 2. Daily task completions
  await safeQuery(
    `SELECT DISTINCT to_char(completed_date, 'YYYY-MM-DD') as activity_date
     FROM user_tasks
     WHERE user_id=$1
     ORDER BY activity_date DESC
     LIMIT 30`,
    [userId]
  );

  // 3. Journal entries
  await safeQuery(
    `SELECT DISTINCT to_char((created_at::timestamptz AT TIME ZONE $2)::date, 'YYYY-MM-DD') as activity_date
     FROM journal_entries
     WHERE user_id=$1
     ORDER BY activity_date DESC
     LIMIT 30`,
    [userId, timezone]
  );

  // 4. Energy logs
  await safeQuery(
    `SELECT DISTINCT to_char(date, 'YYYY-MM-DD') as activity_date
     FROM energy_logs
     WHERE user_id=$1
     ORDER BY activity_date DESC
     LIMIT 30`,
    [userId]
  );

  // 5. Meditation sessions
  await safeQuery(
    `SELECT DISTINCT to_char((started_at::timestamptz AT TIME ZONE $2)::date, 'YYYY-MM-DD') as activity_date
     FROM meditation_sessions
     WHERE user_id=$1
     ORDER BY activity_date DESC
     LIMIT 30`,
    [userId, timezone]
  );

  // 6. Birth charts created
  await safeQuery(
    `SELECT DISTINCT to_char((created_at::timestamptz AT TIME ZONE $2)::date, 'YYYY-MM-DD') as activity_date
     FROM birth_charts
     WHERE user_id=$1
     ORDER BY activity_date DESC
     LIMIT 30`,
    [userId, timezone]
  );

  // 7. Compatibility reports
  await safeQuery(
    `SELECT DISTINCT to_char((created_at::timestamptz AT TIME ZONE $2)::date, 'YYYY-MM-DD') as activity_date
     FROM compatibility_reports
     WHERE user_id=$1
     ORDER BY activity_date DESC
     LIMIT 30`,
    [userId, timezone]
  );

  // 8. Moon reading purchases
  await safeQuery(
    `SELECT DISTINCT to_char((created_at::timestamptz AT TIME ZONE $2)::date, 'YYYY-MM-DD') as activity_date
     FROM moon_reading_purchases
     WHERE user_id=$1
     ORDER BY activity_date DESC
     LIMIT 30`,
    [userId, timezone]
  );

  // Sort descending so most recent dates are first
  return Array.from(activityDates).sort((a, b) => b.localeCompare(a));
}

/**
 * Check which streak milestones the user has hit and auto-award credits for new ones.
 * Returns { milestones: [...], newMilestone: {...} | null }
 */
async function checkAndAwardMilestones(userId, currentStreak) {
  const milestones = [];
  let newMilestone = null;

  if (currentStreak < 7) {
    return { milestones: [], newMilestone: null };
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS streak_milestones (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        milestone_days INTEGER NOT NULL,
        badge_name VARCHAR(100) NOT NULL,
        credits_awarded INTEGER DEFAULT 0,
        achieved_at TIMESTAMP DEFAULT NOW(),
        notified BOOLEAN DEFAULT false,
        UNIQUE(user_id, milestone_days)
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_streak_milestones_user_id ON streak_milestones(user_id)
    `);
  } catch (createError) {
    logger.debug("Milestones table creation:", createError.message);
  }

  // Fetch already-achieved milestones for this user
  let achievedSet = new Set();
  try {
    const { rows } = await pool.query(
      `SELECT milestone_days FROM streak_milestones WHERE user_id = $1`,
      [userId]
    );
    rows.forEach(r => achievedSet.add(r.milestone_days));
  } catch (queryError) {
    logger.debug("Failed to fetch milestones:", queryError.message);
    return { milestones: [], newMilestone: null };
  }

  for (const def of MILESTONE_DEFINITIONS) {
    if (currentStreak < def.days) break;

    const milestoneEntry = {
      days: def.days,
      badgeName: def.badgeName,
      credits: def.credits,
      achieved: achievedSet.has(def.days),
    };
    milestones.push(milestoneEntry);

    if (!achievedSet.has(def.days)) {
      // Award credits
      if (def.credits > 0) {
        try {
          await pool.query(
            `INSERT INTO credits (user_id, credits)
             VALUES ($1, $2)
             ON CONFLICT (user_id)
             DO UPDATE SET credits = credits.credits + $2`,
            [userId, def.credits]
          );
        } catch (creditError) {
          logger.error("Error awarding milestone credits:", creditError);
        }
      }

      // Record milestone
      try {
        await pool.query(
          `INSERT INTO streak_milestones (user_id, milestone_days, badge_name, credits_awarded, notified)
           VALUES ($1, $2, $3, $4, false)`,
          [userId, def.days, def.badgeName, def.credits]
        );
      } catch (insertError) {
        logger.error("Error recording milestone:", insertError);
        continue;
      }

      milestoneEntry.achieved = true;
      newMilestone = { days: def.days, badgeName: def.badgeName, credits: def.credits };
    }
  }

  return { milestones, newMilestone };
}

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = decoded.userId;

    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get('timezone') || 'UTC';

    // Calculate streak from all meaningful daily activity
    const activityDates = await getActivityDates(userId, timezone);

    if (activityDates.length === 0) {
      return NextResponse.json({
        currentStreak: 0,
        longestStreak: 0,
        lastLogin: null
      });
    }

    // Calculate current streak
    let currentStreak = 0;
    const today = getLocalDateString(timezone);
    const yesterday = getLocalDateOffset(timezone, -1);

    // Check if user was active today or yesterday
    if (activityDates.includes(today)) {
      currentStreak = 1;
    } else if (activityDates.includes(yesterday)) {
      currentStreak = 1;
    } else {
      return NextResponse.json({
        currentStreak: 0,
        longestStreak: 0,
        lastLogin: activityDates[0] || null
      });
    }

    // Continue counting backwards
    for (let i = 1; i < 365; i++) {
      const prevDate = getLocalDateOffset(timezone, -i);
      if (activityDates.includes(prevDate)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak (simplified: check all consecutive days)
    let longestStreak = 1;
    let tempStreak = 1;
    for (let i = 1; i < activityDates.length; i++) {
      const prevDate = new Date(activityDates[i - 1]);
      const currDate = new Date(activityDates[i]);
      const daysDiff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    const finalCurrentStreak = Math.max(currentStreak, 0);

    // Check and award milestones
    const { milestones, newMilestone } = await checkAndAwardMilestones(userId, finalCurrentStreak);

    return NextResponse.json({
      currentStreak: finalCurrentStreak,
      longestStreak: Math.max(longestStreak, 1),
      lastLogin: activityDates[0] || null,
      milestones,
      newMilestone
    });
  } catch (error) {
    logger.error("Error calculating streak:", error);
    return NextResponse.json(
      { error: "Failed to calculate streak" },
      { status: 500 }
    );
  }
}
