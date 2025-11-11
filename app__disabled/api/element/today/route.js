import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { zodiacSigns } from "@/lib/zodiac-data";
import { pool } from "@/lib/db";
import * as Astronomy from "astronomy-engine";

export const runtime = "nodejs";

/**
 * GET /api/element/today
 * Returns today's dominant element based on moon phase and current zodiac sign
 */
export async function GET(request) {
  try {
    // Get authenticated user (optional - can provide personalized element)
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);

    // Calculate current moon position
    const now = new Date();
    const moonVector = Astronomy.GeoVector("Moon", now, true);
    const moonEcliptic = Astronomy.Ecliptic(moonVector);
    const moonLongitude = moonEcliptic.elon;

    // Get moon's zodiac sign
    function getZodiacSign(longitude) {
      const signs = [
        "Aries",
        "Taurus",
        "Gemini",
        "Cancer",
        "Leo",
        "Virgo",
        "Libra",
        "Scorpio",
        "Sagittarius",
        "Capricorn",
        "Aquarius",
        "Pisces",
      ];
      const index = Math.floor(longitude / 30);
      return signs[index];
    }

    const moonSign = getZodiacSign(moonLongitude);
    const signData = zodiacSigns.find((s) => s.name === moonSign);
    const element = signData?.element || "Fire";

    // Element explanations
    const explanations = {
      Fire: "Fire energy is passionate, dynamic, and transformative. Today's fire element encourages you to take bold action, express your creativity, and embrace your inner drive.",
      Water: "Water energy flows with intuition, emotion, and deep healing. Today's water element invites you to connect with your feelings, trust your instincts, and nurture your emotional well-being.",
      Air: "Air energy brings clarity, communication, and intellectual growth. Today's air element supports learning, sharing ideas, and connecting with others.",
      Earth: "Earth energy provides stability, grounding, and practical wisdom. Today's earth element encourages you to build solid foundations, stay organized, and manifest your goals through steady action.",
    };

    // If user has a birth chart, we could also consider their sun sign
    let userSign = null;
    if (authResult) {
      try {
        // Try to get user's birth chart from database
        const chartResult = await pool.query(
          `SELECT natal_positions FROM natal_charts 
           WHERE user_id = $1 AND is_primary = true 
           ORDER BY created_at DESC LIMIT 1`,
          [authResult.userId]
        );

        if (chartResult.rows.length === 0) {
          // Fallback to old birth_charts table
          const oldChartResult = await pool.query(
            `SELECT chart_data FROM birth_charts 
             WHERE user_id = $1 
             ORDER BY created_at DESC LIMIT 1`,
            [authResult.userId]
          );

          if (oldChartResult.rows.length > 0) {
            const chartData = typeof oldChartResult.rows[0].chart_data === 'string'
              ? JSON.parse(oldChartResult.rows[0].chart_data)
              : oldChartResult.rows[0].chart_data;
            
            if (chartData?.planets?.sun?.sign) {
              userSign = chartData.planets.sun.sign;
            }
          }
        } else {
          const natalPositions = chartResult.rows[0].natal_positions;
          if (natalPositions?.sun?.sign) {
            userSign = natalPositions.sun.sign;
          }
        }
      } catch (err) {
        // Birth chart fetch is optional
        console.log("Could not fetch user birth chart:", err);
      }
    }

    return NextResponse.json({
      success: true,
      element,
      sign: moonSign,
      userSign,
      explanation: explanations[element],
      computed: true,
    });
  } catch (error) {
    console.error("Element today error:", error);
    // Default to Fire if calculation fails
    return NextResponse.json({
      success: true,
      element: "Fire",
      sign: null,
      explanation: "Fire energy is passionate, dynamic, and transformative.",
      computed: false,
    });
  }
}

