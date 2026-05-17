import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/db';
import { getLocalDateString, getLocalDateOffset } from '@/lib/date-utils';

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

    // Calculate streak from reading activity
    // Get all unique dates when user created readings
    const { rows } = await pool.query(
      `SELECT DISTINCT (created_at::timestamptz AT TIME ZONE $2)::date as activity_date 
       FROM readings 
       WHERE user_id=$1 
       ORDER BY activity_date DESC 
       LIMIT 30`,
      [userId, timezone]
    );

    if (rows.length === 0) {
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
    const activityDates = rows.map(r => r.activity_date.toISOString().split('T')[0]);
    
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

