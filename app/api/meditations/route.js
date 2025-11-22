import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/meditations
 * Returns list of all meditations
 * 
 * Query params:
 * - premium: filter by premium status (true/false)
 * - tag: filter by tag
 * 
 * Returns:
 * {
 *   success: true,
 *   meditations: [
 *     {
 *       id, title, duration_seconds, narrator, premium,
 *       narration_audio_url, description, tags
 *     }
 *   ]
 * }
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const premiumFilter = searchParams.get("premium");
    const tagFilter = searchParams.get("tag");

    let query = `
      SELECT 
        id, title, description, duration_seconds, narrator, 
        premium, narration_audio_url, transcript, tags, created_at
      FROM meditations
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (premiumFilter !== null) {
      query += ` AND premium = $${paramIndex}`;
      params.push(premiumFilter === "true");
      paramIndex++;
    }

    if (tagFilter) {
      query += ` AND $${paramIndex} = ANY(tags)`;
      params.push(tagFilter);
      paramIndex++;
    }

    query += ` ORDER BY premium ASC, duration_seconds ASC, title ASC`;

    const { rows } = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      meditations: rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        duration_seconds: row.duration_seconds,
        narrator: row.narrator,
        premium: row.premium,
        narration_audio_url: row.narration_audio_url,
        transcript: row.transcript,
        tags: row.tags || [],
      })),
    });
  } catch (error) {
    console.error("Get meditations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch meditations", details: error.message },
      { status: 500 }
    );
  }
}

