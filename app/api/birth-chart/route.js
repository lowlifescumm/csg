import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { pool } from '@/lib/db.js';
import { interpretBirthChart } from '@/lib/astrology.js';
import { canAccessReading, consumeCreditsForReading, claimFreeNatalChart } from '@/lib/access-control.js';
import { formatCreditError } from '@/lib/credit-error-handler.js';
import { getAuthenticatedUser } from '@/lib/auth.js';
import { hydrateReportData } from '@/src/services/chartHydrator';

/**
 * POST /api/birth-chart
 * Create a new birth chart
 */
export async function POST(req) {
  try {
    // Get authenticated user (supports both NextAuth and JWT)
    const authResult = await getAuthenticatedUser(req.cookies, authOptions);
    
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { userId } = authResult;

    const body = await req.json();
    const { date, time, location, latitude, longitude, generateInterpretation } = body;

    if (!date || !time || !location || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Date, time, location, latitude, and longitude are all required'
      }, { status: 400 });
    }

    const latNumber = typeof latitude === 'number' ? latitude : parseFloat(latitude);
    const lonNumber = typeof longitude === 'number' ? longitude : parseFloat(longitude);

    const hydrationInput = {
      name: body.name || 'Primary Chart',
      birthDate: date,
      birthTime: time,
      birthCity: location,
      birthLatitude: latNumber,
      birthLongitude: lonNumber,
    };

    const hydrated = await hydrateReportData(hydrationInput);

    // Calculate birth chart - NOW FREE (no credit check)
    const chartData = hydrated.rawChart;

    // Generate AI interpretation ONLY if requested and user has credits
    let interpretation = '';
    if (generateInterpretation) {
      // Check access permissions for interpretation generation
      const accessCheck = await canAccessReading(userId, 'NATAL_CHART');
      
      if (!accessCheck.allowed) {
        if (accessCheck.reason === 'insufficient_credits') {
          return NextResponse.json({
            error: 'Insufficient credits',
            details: `Interpretation requires ${accessCheck.required} credits`,
            cost: accessCheck.required,
            chart: chartData // Return chart data even if interpretation fails
          }, { status: 402 }); // Payment Required
        }
        return NextResponse.json({
          error: 'Access denied',
          details: accessCheck.reason
        }, { status: 403 });
      }

      // Generate AI interpretation
      if (process.env.OPENAI_API_KEY) {
        try {
          interpretation = await interpretBirthChart(chartData);
        } catch (error) {
          console.error('Failed to generate interpretation:', error);
          interpretation = 'Interpretation generation failed. Your chart data is still saved.';
        }
      }

      // Consume credits for the interpretation (if not subscription-included)
      const creditResult = await consumeCreditsForReading(userId, 'NATAL_CHART');
      
      if (!creditResult.success) {
        const errorResponse = formatCreditError(creditResult);
        return NextResponse.json({
          ...errorResponse,
          chart: chartData // Return chart data even if credit processing fails
        }, { status: errorResponse.status });
      }

      // Handle free natal chart for new subscribers
      if (accessCheck.reason === 'subscription_included') {
        const freeChartResult = await claimFreeNatalChart(userId);
        if (freeChartResult.success) {
          console.log(`[Birth Chart] Free natal chart claimed for user ${userId}`);
        }
      }
    }

    // Save to both tables for compatibility
    
    // 1. Save to old birth_charts table (includes all premium data points in chart_data JSON)
    const oldResult = await pool.query(
      `INSERT INTO birth_charts 
        (user_id, birth_date, birth_time, location, latitude, longitude, chart_data, interpretation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [userId, date, time, location, latNumber, lonNumber, JSON.stringify(chartData), interpretation]
    );
    // Note: chartData now includes: planetSignHouseCombinations, houseCuspsDetailed, 
    // chartRulerLocation, majorAspects, midpoints - all stored in chart_data JSON

    // 2. Save to new natal_charts table if it exists
    try {
      // Save premium data points to natal_charts table
      // Store premium data in a JSONB column or add new columns
      await pool.query(
        `INSERT INTO natal_charts 
          (user_id, name, birth_date, birth_time, location, latitude, longitude, timezone,
           natal_positions, houses, aspects, ascendant, midheaven, interpretation, 
           is_primary, distribution, part_of_fortune, chart_ruler, dignities, moon_phase, 
           chart_patterns, planet_houses)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
         ON CONFLICT (user_id, name) DO UPDATE SET
           birth_date = EXCLUDED.birth_date,
           birth_time = EXCLUDED.birth_time,
           location = EXCLUDED.location,
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           natal_positions = EXCLUDED.natal_positions,
           houses = EXCLUDED.houses,
           aspects = EXCLUDED.aspects,
           ascendant = EXCLUDED.ascendant,
           midheaven = EXCLUDED.midheaven,
           interpretation = EXCLUDED.interpretation,
           updated_at = CURRENT_TIMESTAMP`,
        [
          userId, 
          'Primary Chart',
          date,
          time,
          location,
          latNumber,
          lonNumber,
          'UTC', // Default timezone
          JSON.stringify({
            ...chartData.planets,
            // Include premium data points in natal_positions JSONB
            _premium_data: {
              planetSignHouseCombinations: chartData.planetSignHouseCombinations || [],
              houseCuspsDetailed: chartData.houseCuspsDetailed || [],
              chartRulerLocation: chartData.chartRulerLocation || null,
              majorAspects: chartData.majorAspects || [],
              midpoints: chartData.midpoints || []
            }
          }),
          JSON.stringify({
            ...chartData.houses,
            // Include house cusps detailed in houses JSONB
            _cusps_detailed: chartData.houseCuspsDetailed || []
          }),
          JSON.stringify({
            all: chartData.aspects || [],
            major: chartData.majorAspects || []
          }),
          chartData.ascendant,
          chartData.midheaven,
          interpretation,
          true, // is_primary
          JSON.stringify(chartData.distribution),
          JSON.stringify(chartData.partOfFortune),
          chartData.chartRuler,
          JSON.stringify(chartData.dignities || {}),
          JSON.stringify(chartData.moonPhase || {}),
          JSON.stringify(chartData.chartPatterns || []),
          JSON.stringify({
            ...chartData.planetHouses || {},
            // Include planet-sign-house combinations
            _combinations: chartData.planetSignHouseCombinations || []
          })
        ]
      );
    } catch (error) {
      console.log('Note: natal_charts table may not exist yet, only saved to birth_charts');
    }

    return NextResponse.json({
      success: true,
      chart: chartData,
      interpretation: interpretation || null, // null if not generated
      chartId: oldResult.rows[0].id,
      hasInterpretation: !!interpretation
    });

  } catch (error) {
    console.error('Error creating birth chart:', error);
    return NextResponse.json({ 
      error: 'Failed to create birth chart',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * GET /api/birth-chart
 * Fetch the user's saved birth chart
 */
export async function GET(req) {
  try {
    // Get authenticated user (supports both NextAuth and JWT)
    const authResult = await getAuthenticatedUser(req.cookies, authOptions);
    
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { userId } = authResult;

    // Try new natal_charts table first
    let result = await pool.query(
      'SELECT * FROM natal_charts WHERE user_id = $1 AND is_primary = true ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    // Fallback to old birth_charts table
    if (result.rows.length === 0) {
      result = await pool.query(
        'SELECT * FROM birth_charts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [userId]
      );
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        hasChart: false,
        message: 'No birth chart found. Please create one first.' 
      });
    }

    const savedChart = result.rows[0];

    // Parse chart data (include premium data points)
    let chartData;
    if (savedChart.natal_positions) {
      // New format - extract premium data from natal_positions._premium_data
      const natalPositions = typeof savedChart.natal_positions === 'string' 
        ? JSON.parse(savedChart.natal_positions) 
        : savedChart.natal_positions;
      
      const premiumData = natalPositions._premium_data || {};
      
      // Extract planets (excluding _premium_data)
      const planets = { ...natalPositions };
      delete planets._premium_data;
      
      const houses = typeof savedChart.houses === 'string' 
        ? JSON.parse(savedChart.houses) 
        : savedChart.houses;
      
      const aspects = typeof savedChart.aspects === 'string' 
        ? JSON.parse(savedChart.aspects) 
        : savedChart.aspects;
      
      chartData = {
        planets,
        houses: houses || {},
        aspects: aspects?.all || aspects || [],
        ascendant: savedChart.ascendant,
        midheaven: savedChart.midheaven,
        distribution: savedChart.distribution ? (typeof savedChart.distribution === 'string' ? JSON.parse(savedChart.distribution) : savedChart.distribution) : null,
        partOfFortune: savedChart.part_of_fortune ? (typeof savedChart.part_of_fortune === 'string' ? JSON.parse(savedChart.part_of_fortune) : savedChart.part_of_fortune) : null,
        chartRuler: savedChart.chart_ruler,
        // Include premium data points
        planetSignHouseCombinations: premiumData.planetSignHouseCombinations || [],
        houseCuspsDetailed: premiumData.houseCuspsDetailed || houses?._cusps_detailed || [],
        chartRulerLocation: premiumData.chartRulerLocation || null,
        majorAspects: premiumData.majorAspects || aspects?.major || [],
        midpoints: premiumData.midpoints || []
      };
    } else {
      // Old format - recalculate (will include premium data points)
      const chart = savedChart.chart_data;
      chartData = typeof chart === 'string' ? JSON.parse(chart) : chart;
      
      // If old format doesn't have premium data, recalculate
      if (!chartData.planetSignHouseCombinations) {
        const { calculateBirthChart } = await import('@/lib/astrology.js');
        chartData = calculateBirthChart(
          savedChart.birth_date,
          savedChart.birth_time,
          savedChart.latitude,
          savedChart.longitude
        );
      }
    }

    return NextResponse.json({
      hasChart: true,
      chart: chartData,
      birthInfo: {
        date: savedChart.birth_date,
        time: savedChart.birth_time,
        location: savedChart.location,
        latitude: savedChart.latitude,
        longitude: savedChart.longitude
      },
      interpretation: savedChart.interpretation
    });
  } catch (error) {
    console.error('Error fetching birth chart:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch birth chart',
      details: error.message
    }, { status: 500 });
  }
}
