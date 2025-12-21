import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { authOptions } from '@/lib/auth-config';
import { pool } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Calculate rewards for a level
 */
function calculateLevelRewards(level) {
  const rewards = {
    credits: level * 5, // 5 credits per level
    premiumReadings: level >= 2 ? 1 : 0,
    exclusiveContent: level >= 3,
    premiumPreview: level >= 4,
    lifetimeBenefits: level >= 5,
  };
  return rewards;
}

/**
 * POST /api/rewards/claim
 * Claim rewards for reaching a level
 * 
 * Body:
 * - userId: User ID (optional, will use authenticated user)
 * - level: Level to claim rewards for
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
    const { level } = body;

    if (!level || level < 1) {
      return NextResponse.json({ error: "Valid level is required" }, { status: 400 });
    }

    // Check if rewards table exists
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS level_rewards (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          level INTEGER NOT NULL,
          credits_awarded INTEGER DEFAULT 0,
          premium_readings INTEGER DEFAULT 0,
          exclusive_content BOOLEAN DEFAULT false,
          premium_preview BOOLEAN DEFAULT false,
          lifetime_benefits BOOLEAN DEFAULT false,
          claimed_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, level)
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_level_rewards_user_id ON level_rewards(user_id);
      `);
    } catch (createError) {
      console.log("Rewards table creation:", createError.message);
    }

    // Check if reward already claimed
    const existingReward = await pool.query(
      `SELECT id FROM level_rewards 
       WHERE user_id = $1 AND level = $2`,
      [userId, level]
    );

    if (existingReward.rows.length > 0) {
      return NextResponse.json({
        error: "Reward for this level already claimed",
      }, { status: 400 });
    }

    // Calculate rewards
    const rewards = calculateLevelRewards(level);

    // Award credits
    if (rewards.credits > 0) {
      try {
        await pool.query(
          `INSERT INTO credits (user_id, credits)
           VALUES ($1, $2)
           ON CONFLICT (user_id) 
           DO UPDATE SET credits = credits.credits + $2`,
          [userId, rewards.credits]
        );
      } catch (creditError) {
        console.error("Error awarding credits:", creditError);
        // Continue even if credit award fails
      }
    }

    // Record reward claim
    await pool.query(
      `INSERT INTO level_rewards 
       (user_id, level, credits_awarded, premium_readings, exclusive_content, premium_preview, lifetime_benefits)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        level,
        rewards.credits,
        rewards.premiumReadings,
        rewards.exclusiveContent,
        rewards.premiumPreview,
        rewards.lifetimeBenefits,
      ]
    );

    // Get current level from XP
    const xpResult = await pool.query(
      `SELECT total_xp, current_level FROM user_xp WHERE user_id = $1`,
      [userId]
    );

    let currentLevel = 1;
    if (xpResult.rows.length > 0) {
      currentLevel = xpResult.rows[0].current_level || 1;
    }

    return NextResponse.json({
      success: true,
      level,
      newLevel: currentLevel,
      rewards: {
        credits: rewards.credits,
        premiumReadings: rewards.premiumReadings,
        exclusiveContent: rewards.exclusiveContent,
        premiumPreview: rewards.premiumPreview,
        lifetimeBenefits: rewards.lifetimeBenefits,
      },
    });
  } catch (error) {
    console.error("Claim reward error:", error);
    return NextResponse.json(
      { error: "Failed to claim reward", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rewards/claim?level={level}
 * Check if a level reward has been claimed
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
    const level = parseInt(searchParams.get("level"));

    if (!level) {
      return NextResponse.json({ error: "Level parameter is required" }, { status: 400 });
    }

    try {
      const result = await pool.query(
        `SELECT id, claimed_at FROM level_rewards 
         WHERE user_id = $1 AND level = $2`,
        [userId, level]
      );

      return NextResponse.json({
        success: true,
        claimed: result.rows.length > 0,
        claimedAt: result.rows[0]?.claimed_at || null,
      });
    } catch (queryError) {
      // Table might not exist yet
      return NextResponse.json({
        success: true,
        claimed: false,
        claimedAt: null,
      });
    }
  } catch (error) {
    console.error("Get reward status error:", error);
    return NextResponse.json(
      { error: "Failed to check reward status", details: error.message },
      { status: 500 }
    );
  }
}

