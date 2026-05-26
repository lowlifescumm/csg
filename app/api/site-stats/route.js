const logger = require('../../../lib/logger');
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [userResult, readingResult, chartResult, todayReadingsResult] = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM users"),
      pool.query("SELECT COUNT(*) as count FROM readings"),
      pool.query("SELECT COUNT(*) as count FROM birth_charts"),
      pool.query(
        "SELECT COUNT(*) as count FROM readings WHERE created_at >= CURRENT_DATE"
      ),
    ]);

    const totalUsers = parseInt(userResult.rows[0]?.count ?? "0");
    const totalReadings = parseInt(readingResult.rows[0]?.count ?? "0");
    const totalCharts = parseInt(chartResult.rows[0]?.count ?? "0");
    const readingsToday = parseInt(todayReadingsResult.rows[0]?.count ?? "0");

    const trustBadge = totalUsers >= 50000
      ? `${Math.floor(totalUsers / 1000)}k+`
      : totalUsers >= 1000
        ? `${Math.floor(totalUsers / 1000)}k+`
        : `${totalUsers}+`;

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalReadings,
        totalCharts,
        readingsToday,
        trustBadge,
      },
    });
  } catch (error) {
    logger.error("Site stats error:", error);
    return NextResponse.json({
      success: false,
      data: {
        totalUsers: 0,
        totalReadings: 0,
        totalCharts: 0,
        readingsToday: 0,
        trustBadge: "50,000+",
      },
    });
  }
}
