import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

/**
 * POST /api/journal
 * Save content to user's journal
 * 
 * Body:
 * - content: The content to save
 * - type: Type of journal entry (e.g., "briefing", "reading", "reflection")
 * - sign: Zodiac sign if applicable
 * - date: Date of the entry (ISO format)
 * - metadata: Optional additional metadata (JSON)
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
    const { content, type = "general", sign, date, metadata } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Check if journal table exists, if not create it
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS journal_entries (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'general',
          sign VARCHAR(20),
          entry_date DATE DEFAULT CURRENT_DATE,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
        CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
      `);
    } catch (createError) {
      // Table might already exist, continue
      console.log("Journal table creation:", createError.message);
    }

    // Insert journal entry
    const result = await pool.query(
      `INSERT INTO journal_entries (user_id, content, type, sign, entry_date, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [
        userId,
        content,
        type,
        sign || null,
        date ? new Date(date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    return NextResponse.json({
      success: true,
      entry: {
        id: result.rows[0].id,
        created_at: result.rows[0].created_at,
      },
    });
  } catch (error) {
    console.error("Journal save error:", error);
    return NextResponse.json(
      { error: "Failed to save to journal", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/journal
 * Get user's journal entries
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
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    try {
      const result = await pool.query(
        `SELECT id, content, type, sign, entry_date, metadata, created_at
         FROM journal_entries
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return NextResponse.json({
        success: true,
        entries: result.rows,
      });
    } catch (queryError) {
      // Table might not exist yet
      return NextResponse.json({
        success: true,
        entries: [],
      });
    }
  } catch (error) {
    console.error("Journal get error:", error);
    return NextResponse.json(
      { error: "Failed to fetch journal entries", details: error.message },
      { status: 500 }
    );
  }
}

