import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { authOptions } from '@/lib/auth-config';
import { pool } from "@/lib/db";
import logger from "@/lib/logger";

export const runtime = "nodejs";

/**
 * GET /api/user/meditations
 * Returns user's meditation session history
 * 
 * Query params:
 * - limit: number of sessions to return (default: 50)
 * - offset: pagination offset (default: 0)
 * 
 * Returns:
 * {
 *   success: true,
 *   sessions: [
 *     {
 *       id, session_id, meditation_id, meditation_title,
 *       started_at, completed_at, duration_seconds, xp_awarded
 *     }
 *   ],
 *   total: number
 * }
 */
export async function GET(request) {
  try {
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);

    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = authResult;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get total count
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM meditation_sessions WHERE user_id = $1",
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    // Get sessions with meditation details
    const sessionsResult = await pool.query(
      `SELECT 
        ms.id, ms.session_id, ms.meditation_id, ms.started_at, 
        ms.completed_at, ms.duration_seconds, ms.xp_awarded,
        m.title as meditation_title, m.duration_seconds as meditation_duration
       FROM meditation_sessions ms
       JOIN meditations m ON ms.meditation_id = m.id
       WHERE ms.user_id = $1
       ORDER BY ms.started_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return NextResponse.json({
      success: true,
      sessions: sessionsResult.rows.map((row) => ({
        id: row.id,
        sessionId: row.session_id,
        meditationId: row.meditation_id,
        meditationTitle: row.meditation_title,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        durationSeconds: row.duration_seconds,
        meditationDuration: row.meditation_duration,
        xpAwarded: row.xp_awarded,
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    logger.error("Get user meditations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch meditation sessions", details: error.message },
      { status: 500 }
    );
  }
}


