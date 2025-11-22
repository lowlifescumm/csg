import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { pool } from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/user/favorites?type={type}&itemId={itemId}
 * Check if an item is favorited, or get all favorites
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
    const type = searchParams.get("type");
    const itemId = searchParams.get("itemId");

    // Create table if it doesn't exist
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_favorites (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          item_id VARCHAR(100) NOT NULL,
          name VARCHAR(255),
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, type, item_id)
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_favorites_type ON user_favorites(type);
      `);
    } catch (createError) {
      console.log("Favorites table creation:", createError.message);
    }

    // If specific item requested, check if it's favorited
    if (type && itemId) {
      const result = await pool.query(
        `SELECT id FROM user_favorites 
         WHERE user_id = $1 AND type = $2 AND item_id = $3`,
        [userId, type, itemId]
      );

      return NextResponse.json({
        success: true,
        isFavorited: result.rows.length > 0,
      });
    }

    // Otherwise, get all favorites
    const result = await pool.query(
      `SELECT id, type, item_id, name, metadata, created_at
       FROM user_favorites
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      favorites: result.rows,
    });
  } catch (error) {
    console.error("Get favorites error:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/favorites
 * Add an item to favorites
 * 
 * Body:
 * - type: Type of item (e.g., "crystal", "reading", "article")
 * - itemId: Unique identifier for the item
 * - name: Display name for the item
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
    const { type, itemId, name, metadata } = body;

    if (!type || !itemId) {
      return NextResponse.json(
        { error: "Type and itemId are required" },
        { status: 400 }
      );
    }

    // Create table if it doesn't exist
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_favorites (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          item_id VARCHAR(100) NOT NULL,
          name VARCHAR(255),
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, type, item_id)
        )
      `);
    } catch (createError) {
      console.log("Favorites table creation:", createError.message);
    }

    // Insert favorite
    const result = await pool.query(
      `INSERT INTO user_favorites (user_id, type, item_id, name, metadata)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, type, item_id) 
       DO UPDATE SET 
         name = EXCLUDED.name,
         metadata = EXCLUDED.metadata,
         created_at = NOW()
       RETURNING id, created_at`,
      [userId, type, itemId, name || null, metadata ? JSON.stringify(metadata) : null]
    );

    return NextResponse.json({
      success: true,
      favorite: {
        id: result.rows[0].id,
        created_at: result.rows[0].created_at,
      },
    });
  } catch (error) {
    console.error("Post favorites error:", error);
    return NextResponse.json(
      { error: "Failed to add favorite", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/favorites?type={type}&itemId={itemId}
 * Remove an item from favorites
 */
export async function DELETE(request) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);

    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = authResult;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const itemId = searchParams.get("itemId");

    if (!type || !itemId) {
      return NextResponse.json(
        { error: "Type and itemId are required" },
        { status: 400 }
      );
    }

    await pool.query(
      `DELETE FROM user_favorites 
       WHERE user_id = $1 AND type = $2 AND item_id = $3`,
      [userId, type, itemId]
    );

    return NextResponse.json({
      success: true,
      message: "Favorite removed",
    });
  } catch (error) {
    console.error("Delete favorites error:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite", details: error.message },
      { status: 500 }
    );
  }
}

