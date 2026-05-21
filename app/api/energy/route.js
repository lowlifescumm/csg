import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { authOptions } from '@/lib/auth-config';
import { pool } from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/energy
 * Returns user's weekly energy data (physical, emotional, spiritual)
 */
export async function GET(request) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);

    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = authResult;

    // Check if energy_logs table exists, if not return empty
    try {
      // Try to fetch energy data
      const result = await pool.query(
        `SELECT date, physical, emotional, spiritual
         FROM energy_logs
         WHERE user_id = $1
         AND date >= CURRENT_DATE - INTERVAL '7 days'
         ORDER BY date ASC`,
        [userId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          message: "No energy data available",
        });
      }

      // Format data for chart
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const formattedData = result.rows.map((row, index) => ({
        day: days[index % 7] || new Date(row.date).toLocaleDateString("en-US", { weekday: "short" }),
        physical: row.physical || 0,
        emotional: row.emotional || 0,
        spiritual: row.spiritual || 0,
      }));

      return NextResponse.json({
        success: true,
        data: formattedData,
      });
    } catch (queryError) {
      // Table doesn't exist yet, return empty
      return NextResponse.json({
        success: true,
        data: [],
        message: "Energy logging not yet available",
      });
    }
  } catch (error) {
    logger.error("Get energy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch energy data", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/energy
 * Log energy levels for a specific date
 * 
 * Body:
 * - date: Date string (ISO format, optional - defaults to today)
 * - physical: Physical energy level (0-100)
 * - emotional: Emotional energy level (0-100)
 * - spiritual: Spiritual energy level (0-100)
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
    const { date, physical, emotional, spiritual } = body;

    if (physical === undefined || emotional === undefined || spiritual === undefined) {
      return NextResponse.json(
        { error: "Physical, emotional, and spiritual values are required" },
        { status: 400 }
      );
    }

    // Validate values (0-100)
    if (physical < 0 || physical > 100 || emotional < 0 || emotional > 100 || spiritual < 0 || spiritual > 100) {
      return NextResponse.json(
        { error: "Energy values must be between 0 and 100" },
        { status: 400 }
      );
    }

    const logDate = date ? new Date(date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];

    // Create table if it doesn't exist
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS energy_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          physical INTEGER NOT NULL CHECK (physical >= 0 AND physical <= 100),
          emotional INTEGER NOT NULL CHECK (emotional >= 0 AND emotional <= 100),
          spiritual INTEGER NOT NULL CHECK (spiritual >= 0 AND spiritual <= 100),
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, date)
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_energy_logs_user_id ON energy_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_energy_logs_date ON energy_logs(date);
      `);
    } catch (createError) {
      logger.info("Energy logs table creation:", createError.message);
    }

    // Insert or update energy log
    const result = await pool.query(
      `INSERT INTO energy_logs (user_id, date, physical, emotional, spiritual)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, date)
       DO UPDATE SET
         physical = EXCLUDED.physical,
         emotional = EXCLUDED.emotional,
         spiritual = EXCLUDED.spiritual,
         created_at = NOW()
       RETURNING id, date, physical, emotional, spiritual`,
      [userId, logDate, physical, emotional, spiritual]
    );

    return NextResponse.json({
      success: true,
      log: result.rows[0],
    });
  } catch (error) {
    logger.error("Post energy error:", error);
    return NextResponse.json(
      { error: "Failed to log energy", details: error.message },
      { status: 500 }
    );
  }
}

