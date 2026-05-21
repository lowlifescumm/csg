import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/db';
import { getLocalDateString, getLocalDateOffset } from '@/lib/date-utils';
import logger from '@/lib/logger';

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

    return NextResponse.json({
      currentStreak: Math.max(currentStreak, 0),
      longestStreak: Math.max(longestStreak, 1),
      lastLogin: activityDates[0] || null
    });
  } catch (error) {
    logger.error("Error calculating streak:", error);
    return NextResponse.json(
      { error: "Failed to calculate streak" },
      { status: 500 }
    );
  }
}
