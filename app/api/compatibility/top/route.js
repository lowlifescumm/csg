import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { pool } from "@/lib/db";
import { calculateCompatibilityScores } from "@/lib/compatibility";
import { calculateBirthChart } from "@/lib/astrology";
import { zodiacSigns } from "@/lib/zodiac-data";

export const runtime = "nodejs";

/**
 * Get element from sign
 */
function getElement(sign) {
  const signData = zodiacSigns.find((s) => s.name === sign);
  return signData?.element || "Fire";
}

/**
 * Get primary reason for compatibility
 */
function getCompatibilityReasons(userChart, matchSign, matchElement, scores) {
  const reasons = [];
  const userElement = getElement(userChart.planets?.sun?.sign || "Aries");

  // Element compatibility
  if (userElement === matchElement) {
    reasons.push(`Both ${userElement} signs - natural elemental harmony`);
  } else if (
    (userElement === "Fire" && matchElement === "Air") ||
    (userElement === "Air" && matchElement === "Fire") ||
    (userElement === "Earth" && matchElement === "Water") ||
    (userElement === "Water" && matchElement === "Earth")
  ) {
    reasons.push(`${userElement} and ${matchElement} elements complement each other`);
  }

  // High emotional score
  if (scores.emotional >= 70) {
    reasons.push(`Strong emotional connection potential`);
  }

  // High communication score
  if (scores.communication >= 70) {
    reasons.push(`Excellent communication compatibility`);
  }

  // High passion score
  if (scores.passion >= 70) {
    reasons.push(`Strong romantic chemistry`);
  }

  // High long-term score
  if (scores.longTerm >= 70) {
    reasons.push(`Promising long-term potential`);
  }

  // Sun-Moon connections
  if (userChart.planets?.sun?.sign === matchSign) {
    reasons.push(`Matching Sun signs - deep understanding`);
  }

  // Default reason if none found
  if (reasons.length === 0) {
    reasons.push(`${matchElement} sign energy harmonizes well`);
  }

  return reasons;
}

/**
 * GET /api/compatibility/top?userId={userId}
 * Returns top 3-5 compatibility matches for the user
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
    const requestedUserId = searchParams.get("userId");

    // Use requested userId if provided and matches authenticated user (for future flexibility)
    const targetUserId = requestedUserId && requestedUserId === userId.toString() ? userId : authResult.userId;

    // Get user's birth chart
    let userChart = null;
    let userBirthData = null;

    // Try new natal_charts table first
    try {
      const chartResult = await pool.query(
        `SELECT natal_positions, birth_date, birth_time, latitude, longitude
         FROM natal_charts 
         WHERE user_id = $1 AND is_primary = true 
         ORDER BY created_at DESC LIMIT 1`,
        [targetUserId]
      );

      if (chartResult.rows.length > 0) {
        const chart = chartResult.rows[0];
        userChart = {
          planets: chart.natal_positions,
          ascendant: null, // Will be calculated if needed
        };
        userBirthData = {
          date: chart.birth_date,
          time: chart.birth_time,
          latitude: chart.latitude,
          longitude: chart.longitude,
        };
      }
    } catch (err) {
      // Table might not exist, try old format
    }

    // Fallback to old birth_charts table
    if (!userChart) {
      try {
        const oldChartResult = await pool.query(
          `SELECT chart_data, birth_date, birth_time, latitude, longitude
           FROM birth_charts 
           WHERE user_id = $1 
           ORDER BY created_at DESC LIMIT 1`,
          [targetUserId]
        );

        if (oldChartResult.rows.length > 0) {
          const chart = oldChartResult.rows[0];
          const chartData = typeof chart.chart_data === 'string'
            ? JSON.parse(chart.chart_data)
            : chart.chart_data;
          
          userChart = {
            planets: chartData.planets,
            ascendant: chartData.ascendant,
          };
          userBirthData = {
            date: chart.birth_date,
            time: chart.birth_time,
            latitude: chart.latitude,
            longitude: chart.longitude,
          };
        }
      } catch (err) {
        // No chart found
      }
    }

    if (!userChart || !userChart.planets?.sun?.sign) {
      return NextResponse.json({
        success: true,
        matches: [],
        message: "No birth chart found. Please create a birth chart first.",
      });
    }

    // Calculate compatibility with all zodiac signs
    const matches = [];
    const userSunSign = userChart.planets.sun.sign;

    for (const signData of zodiacSigns) {
      // Skip user's own sign
      if (signData.name === userSunSign) continue;

      // Create a representative chart for this sign
      // Use a date that would give us this sun sign (approximately)
      const sampleDate = new Date();
      sampleDate.setMonth((zodiacSigns.findIndex(s => s.name === signData.name) * 30) / 30);
      
      // Create a simple chart for comparison
      // We'll use the sign's typical dates and create a basic chart
      const matchChart = {
        planets: {
          sun: { sign: signData.name },
          moon: { sign: signData.name }, // Simplified - in real implementation, calculate actual moon position
          venus: { sign: signData.name },
          mars: { sign: signData.name },
          mercury: { sign: signData.name },
        },
        ascendant: signData.name,
      };

      // Calculate compatibility scores
      const scores = calculateCompatibilityScores(userChart, matchChart);

      // Get compatibility reasons
      const reasons = getCompatibilityReasons(
        userChart,
        signData.name,
        signData.element,
        scores
      );

      matches.push({
        sign: signData.name,
        element: signData.element,
        score: scores.overall,
        scores: {
          emotional: scores.emotional,
          communication: scores.communication,
          passion: scores.passion,
          longTerm: scores.longTerm,
        },
        reasons,
      });
    }

    // Sort by overall score (descending) and take top 5
    matches.sort((a, b) => b.score - a.score);
    const topMatches = matches.slice(0, 5);

    return NextResponse.json({
      success: true,
      matches: topMatches,
      userSign: userSunSign,
    });
  } catch (error) {
    console.error("Get top matches error:", error);
    return NextResponse.json(
      { error: "Failed to fetch top matches", details: error.message },
      { status: 500 }
    );
  }
}

