import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { pool } from "@/lib/db";
import { generateWeeklyEnergy } from "@/lib/energy-calculator";

export const runtime = "nodejs";

/**
 * GET /api/energy/forecast
 * Returns calculated weekly energy forecast with contributors and summary words
 */
export async function GET(request) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);

    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = authResult;

    // Get user's natal chart
    let chartResult = await pool.query(
      `SELECT * FROM natal_charts WHERE user_id = $1 AND is_primary = true LIMIT 1`,
      [userId]
    );

    // Fallback to birth_charts table
    if (chartResult.rows.length === 0) {
      chartResult = await pool.query(
        `SELECT * FROM birth_charts WHERE user_id = $1 LIMIT 1`,
        [userId]
      );
    }

    if (chartResult.rows.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "No birth chart found. Please create your birth chart first.",
      });
    }

    const natalChartData = chartResult.rows[0];
    
    // Convert to format expected by calculateDailyEnergy
    const natalChart = {
      planets: natalChartData.natal_positions || 
        (typeof natalChartData.chart_data === 'string' 
          ? JSON.parse(natalChartData.chart_data).planets 
          : natalChartData.chart_data?.planets || {}),
      houses: natalChartData.houses || 
        (typeof natalChartData.chart_data === 'string'
          ? JSON.parse(natalChartData.chart_data).houses
          : natalChartData.chart_data?.houses || {})
    };

    // Generate weekly energy forecast
    const weeklyEnergy = generateWeeklyEnergy(natalChart);

    // Format data for chart (add day labels and flatten scores)
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1; // Convert Sunday=0 to Sunday=6

    const formattedData = weeklyEnergy.map((energy, index) => {
      const dayIndex = (todayIndex + index) % 7;
      return {
        day: days[dayIndex],
        physical: energy.scores?.physical || energy.physical || 50,
        emotional: energy.scores?.emotional || energy.emotional || 50,
        spiritual: energy.scores?.spiritual || energy.spiritual || 50,
        isToday: index === 0,
        contributors: energy.contributors || {
          physical: [],
          emotional: [],
          spiritual: []
        },
        summary_word: energy.summary_word || "Balanced",
        date: energy.date
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error("Get energy forecast error:", error);
    return NextResponse.json(
      { error: "Failed to fetch energy forecast", details: error.message },
      { status: 500 }
    );
  }
}

