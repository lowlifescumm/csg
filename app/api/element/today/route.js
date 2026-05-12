const logger = require('../../../lib/logger');
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { authOptions } from '@/lib/auth-config';
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
        // First try natal_charts table (may not exist or may have different column name)
        let chartResult;
        try {
          chartResult = await pool.query(
            `SELECT data FROM natal_charts 
             WHERE user_id = $1 
             ORDER BY is_primary DESC NULLS LAST, created_at DESC LIMIT 1`,
            [authResult.userId]
          );
        } catch (err) {
          // Table or column might not exist, fall through to birth_charts
          chartResult = { rows: [] };
        }

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
          // Check if 'data' column exists, otherwise try other possible column names
          const row = chartResult.rows[0];
          let chartData;
          
          if (row.data !== undefined) {
            chartData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
          } else if (row.chart_data !== undefined) {
            chartData = typeof row.chart_data === 'string' ? JSON.parse(row.chart_data) : row.chart_data;
          } else {
            // No chart data available
            chartData = null;
          }
          
          if (chartData) {
            // Try to get sun sign from various possible data structures
            if (chartData?.planets?.sun?.sign) {
              userSign = chartData.planets.sun.sign;
            } else if (chartData?.natal_positions?.sun?.sign) {
              userSign = chartData.natal_positions.sun.sign;
            } else if (chartData?.sun?.sign) {
              userSign = chartData.sun.sign;
            }
          }
        }
      } catch (err) {
        // Birth chart fetch is optional
        logger.info("Could not fetch user birth chart:", err);
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
    logger.error("Element today error:", error);
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

