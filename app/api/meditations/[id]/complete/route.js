import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { authOptions } from "@/lib/auth-config";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Calculate XP based on meditation duration
 */
function calculateXP(durationSeconds) {
  if (durationSeconds < 180) return 10; // Short (< 3 min)
  if (durationSeconds < 600) return 20; // Medium (3-10 min)
  return 40; // Long (10+ min)
}

/**
 * POST /api/meditations/[id]/complete
 * Marks a meditation session as complete and awards XP
 * 
 * Body:
 * - sessionId: Session ID from start endpoint
 * 
 * Returns:
 * {
 *   success: true,
 *   xpAwarded: number,
 *   totalXP: number,
 *   level: number
 * }
 */
export async function POST(request, { params }) {
  try {
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);

    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = authResult;
    const meditationId = parseInt(params.id);
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    if (!meditationId || isNaN(meditationId)) {
      return NextResponse.json({ error: "Invalid meditation ID" }, { status: 400 });
    }

    // Get session
    const sessionResult = await pool.query(
      `SELECT ms.*, m.duration_seconds 
       FROM meditation_sessions ms
       JOIN meditations m ON ms.meditation_id = m.id
       WHERE ms.session_id = $1 AND ms.user_id = $2 AND ms.meditation_id = $3`,
      [sessionId, userId, meditationId]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessionResult.rows[0];

    if (session.completed_at) {
      return NextResponse.json({ error: "Session already completed" }, { status: 400 });
    }

    // Calculate XP
    const durationSeconds = session.duration_seconds || 0;
    const xpAwarded = calculateXP(durationSeconds);
    const completedAt = new Date();

    // Update session
    await pool.query(
      `UPDATE meditation_sessions 
       SET completed_at = $1, duration_seconds = $2, xp_awarded = $3
       WHERE session_id = $4`,
      [completedAt, durationSeconds, xpAwarded, sessionId]
    );

    // Award XP
    const xpResult = await pool.query(
      `INSERT INTO user_xp (user_id, total_xp, current_level)
       VALUES ($1, $2, 1)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         total_xp = user_xp.total_xp + $2,
         current_level = FLOOR((user_xp.total_xp + $2) / 100) + 1,
         updated_at = NOW()
       RETURNING total_xp, current_level`,
      [userId, xpAwarded]
    );

    const newTotalXP = xpResult.rows[0]?.total_xp || 0;
    const newLevel = xpResult.rows[0]?.current_level || 1;

    // Mark meditation task as complete - Temporarily disabled
    // try {
    //   const today = new Date().toISOString().split("T")[0];
    //   const taskId = "meditation-session";

    //   // Check if already completed today
    //   const existingTask = await pool.query(
    //     `SELECT id FROM user_tasks 
    //      WHERE user_id = $1 AND task_id = $2 AND completed_date = $3`,
    //     [userId, taskId, today]
    //   );

    //   if (existingTask.rows.length === 0) {
    //     // Award task XP (5 XP base)
    //     const taskXP = 5;
    //     await pool.query(
    //       `INSERT INTO user_tasks (user_id, task_id, completed_date, xp_earned, credit_earned, streak_bonus)
    //        VALUES ($1, $2, $3, $4, 0, 0)
    //        ON CONFLICT (user_id, task_id, completed_date) DO NOTHING`,
    //       [userId, taskId, today, taskXP]
    //     );

    //     // Update user XP with task XP
    //     await pool.query(
    //       `UPDATE user_xp 
    //        SET total_xp = total_xp + $1,
    //            current_level = FLOOR((total_xp + $1) / 100) + 1,
    //            updated_at = NOW()
    //        WHERE user_id = $2`,
    //       [taskXP, userId]
    //     );
    //   }
    // } catch (taskError) {
    //   console.error("Error marking meditation task complete:", taskError);
    //   // Don't fail the meditation completion if task marking fails
    // }

    return NextResponse.json({
      success: true,
      xpAwarded,
      totalXP: newTotalXP,
      level: newLevel,
    });
  } catch (error) {
    console.error("Complete meditation session error:", error);
    return NextResponse.json(
      { error: "Failed to complete meditation session", details: error.message },
      { status: 500 }
    );
  }
}

