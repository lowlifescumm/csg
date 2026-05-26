const logger = require('../../../lib/logger');
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT name, role, text, rating, avatar_initials, is_featured
       FROM testimonials
       WHERE is_visible = true
       ORDER BY is_featured DESC, sort_order ASC, created_at DESC
       LIMIT 9`
    );

    return NextResponse.json({
      success: true,
      testimonials: result.rows,
    });
  } catch (error) {
    if (error.code === "42P01") {
      return NextResponse.json({
        success: true,
        testimonials: [],
      });
    }
    logger.error("Testimonials error:", error);
    return NextResponse.json({
      success: true,
      testimonials: [],
    });
  }
}
