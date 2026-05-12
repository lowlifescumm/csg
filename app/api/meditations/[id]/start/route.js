import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { authOptions } from "@/lib/auth-config";
import { pool } from "@/lib/db";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

/**
 * POST /api/meditations/[id]/start
 * Creates a meditation session
 * 
 * Returns:
 * {
 *   success: true,
 *   sessionId: string,
 *   startedAt: ISO timestamp
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

    if (!meditationId || isNaN(meditationId)) {
      return NextResponse.json({ error: "Invalid meditation ID" }, { status: 400 });
    }

    // Verify meditation exists
    const meditationResult = await pool.query(
      "SELECT id, premium FROM meditations WHERE id = $1",
      [meditationId]
    );

    if (meditationResult.rows.length === 0) {
      return NextResponse.json({ error: "Meditation not found" }, { status: 404 });
    }

    const meditation = meditationResult.rows[0];

    // Check premium access if meditation is premium
    if (meditation.premium) {
      const userResult = await pool.query(
        "SELECT role, stripe_subscription_id FROM users WHERE id = $1",
        [userId]
      );
      const user = userResult.rows[0];
      const isAdmin = user?.role === "admin";
      const hasSubscription = !!user?.stripe_subscription_id;

      if (!isAdmin && !hasSubscription) {
        return NextResponse.json(
          { error: "Premium meditation requires subscription", premium: true },
          { status: 402 }
        );
      }
    }

    // Generate unique session ID
    const sessionId = `med_${randomBytes(16).toString("hex")}`;
    const startedAt = new Date();

    // Create session
    await pool.query(
      `INSERT INTO meditation_sessions (user_id, meditation_id, session_id, started_at)
       VALUES ($1, $2, $3, $4)`,
      [userId, meditationId, sessionId, startedAt]
    );

    return NextResponse.json({
      success: true,
      sessionId,
      startedAt: startedAt.toISOString(),
    });
  } catch (error) {
    logger.error("Start meditation session error:", error);
    return NextResponse.json(
      { error: "Failed to start meditation session", details: error.message },
      { status: 500 }
    );
  }
}


