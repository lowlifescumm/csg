import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { authOptions } from '@/lib/auth-config';
import { pool } from "@/lib/db";

/**
 * POST /api/share/track
 * 
 * Track social media shares and award credits
 * - Awards 3 free credits per reading share
 * - Prevents duplicate credit awards per reading
 */
export async function POST(request) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);
    
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = authResult;
    const { readingId } = await request.json();

    if (!readingId) {
      return NextResponse.json({ error: "readingId is required" }, { status: 400 });
    }

    // Check if credits were already awarded for this reading
    const checkResult = await pool.query(
      `SELECT id FROM reading_shares 
       WHERE user_id = $1 AND reading_id = $2`,
      [userId, readingId]
    );

    if (checkResult.rows.length > 0) {
      // Already awarded - return success but don't award again
      return NextResponse.json({ 
        success: true, 
        creditsAwarded: 0,
        message: "Credits already awarded for this reading" 
      });
    }

    // Award 3 free credits
    // Check if user has existing credits record
    const existingCredits = await pool.query(
      `SELECT id, credits FROM credits WHERE user_id = $1 ORDER BY id DESC LIMIT 1`,
      [userId]
    );

    let creditResult;
    if (existingCredits.rows.length > 0) {
      // Update existing record
      creditResult = await pool.query(
        `UPDATE credits SET credits = credits + 3, updated_at = NOW() 
         WHERE id = $1 
         RETURNING credits`,
        [existingCredits.rows[0].id]
      );
    } else {
      // Create new record
      creditResult = await pool.query(
        `INSERT INTO credits (user_id, credits, created_at, updated_at) 
         VALUES ($1, 3, NOW(), NOW()) 
         RETURNING credits`,
        [userId]
      );
    }

    // Track that credits were awarded for this reading
    await pool.query(
      `INSERT INTO reading_shares (user_id, reading_id, credits_awarded, shared_at)
       VALUES ($1, $2, 3, NOW())
       ON CONFLICT (user_id, reading_id) DO NOTHING`,
      [userId, readingId]
    );

    // Log credit award (if table exists)
    try {
      await pool.query(
        `INSERT INTO credit_usage_history (user_id, credit_type, action, amount, description, related_id)
         VALUES ($1, 'share', 'added', 3, 'Share bonus credits', $2)`,
        [userId, readingId]
      );
    } catch (error) {
      // Table doesn't exist - that's okay, we can skip logging
      logger.info("credit_usage_history table not found, skipping log entry");
    }

    return NextResponse.json({ 
      success: true, 
      creditsAwarded: 3,
      totalCredits: creditResult.rows[0]?.credits || 0,
      message: "3 credits added to your account!" 
    });
  } catch (error) {
    logger.error("Error tracking share:", error);
    
    // If table doesn't exist, create it and retry
    if (error.message?.includes("relation \"reading_shares\" does not exist")) {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS reading_shares (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            reading_id INTEGER NOT NULL REFERENCES readings(id) ON DELETE CASCADE,
            credits_awarded INTEGER DEFAULT 3,
            shared_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, reading_id)
          );
          CREATE INDEX IF NOT EXISTS idx_reading_shares_user_reading ON reading_shares(user_id, reading_id);
        `);
        
        // Retry the credit award
        return await POST(request);
      } catch (createError) {
        logger.error("Error creating reading_shares table:", createError);
      }
    }

    return NextResponse.json(
      { error: "Failed to track share" },
      { status: 500 }
    );
  }
}
