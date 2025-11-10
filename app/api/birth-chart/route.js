import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { pool } from '@/lib/db.js';
import { calculateBirthChart, interpretBirthChart } from '@/lib/astrology.js';
import { canAccessReading, consumeCreditsForReading, claimFreeNatalChart } from '@/lib/access-control.js';
import { getAuthenticatedUser } from '@/lib/auth.js';

/**
 * @swagger
 * /api/birth-chart:
 *   post:
 *     summary: Create a new birth chart.
 *     description: Calculates and saves a new birth chart for the authenticated user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *               time:
 *                 type: string
 *               location:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Birth chart created successfully.
 *       400:
 *         description: Bad request, missing parameters.
 *       401:
 *         description: Unauthorized.
 *       402:
 *         description: Payment required, insufficient credits.
 *       403:
 *         description: Forbidden, access denied.
 *       500:
 *         description: Failed to create birth chart.
 */
export async function POST(req) {
  try {
    const authResult = await getAuthenticatedUser(req.cookies, authOptions);
    
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { userId } = authResult;

    const body = await req.json();
    const { date, time, location, latitude, longitude } = body;

    if (!date || !time || !location || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Date, time, location, latitude, and longitude are all required'
      }, { status: 400 });
    }

    const accessCheck = await canAccessReading(userId, 'NATAL_CHART');
    
    if (!accessCheck.allowed) {
      if (accessCheck.reason === 'insufficient_credits') {
        return NextResponse.json({
          error: 'Insufficient credits',
          details: `Natal Chart requires ${accessCheck.required} credits`,
          cost: accessCheck.required
        }, { status: 402 });
      }
      return NextResponse.json({
        error: 'Access denied',
        details: accessCheck.reason
      }, { status: 403 });
    }

    const chartData = calculateBirthChart(date, time, latitude, longitude);

    let interpretation = '';
    if (process.env.OPENAI_API_KEY) {
      try {
        interpretation = await interpretBirthChart(chartData);
      } catch (error) {
        console.error('Failed to generate interpretation:', error);
        interpretation = 'Interpretation generation failed. Your chart data is still saved.';
      }
    }

    const creditResult = await consumeCreditsForReading(userId, 'NATAL_CHART');
    
    if (!creditResult.success) {
      return NextResponse.json({
        error: 'Credit processing failed',
        details: creditResult.message,
        cost: creditResult.cost
      }, { status: 402 });
    }

    if (accessCheck.reason === 'subscription_included') {
      const freeChartResult = await claimFreeNatalChart(userId);
      if (freeChartResult.success) {
        console.log(`[Birth Chart] Free natal chart claimed for user ${userId}`);
      }
    }

    const oldResult = await pool.query(
      `INSERT INTO birth_charts 
        (user_id, birth_date, birth_time, location, latitude, longitude, chart_data, interpretation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [userId, date, time, location, latitude, longitude, JSON.stringify(chartData), interpretation]
    );

    try {
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
          latitude,
          longitude,
          'UTC',
          JSON.stringify(chartData.planets),
          JSON.stringify(chartData.houses),
          JSON.stringify(chartData.aspects),
          chartData.ascendant,
          chartData.midheaven,
          interpretation,
          true,
          JSON.stringify(chartData.distribution),
          JSON.stringify(chartData.partOfFortune),
          chartData.chartRuler,
          JSON.stringify(chartData.dignities || {}),
          JSON.stringify(chartData.moonPhase || {}),
          JSON.stringify(chartData.chartPatterns || []),
          JSON.stringify(chartData.planetHouses || {})
        ]
      );
    } catch (error) {
      console.log('Note: natal_charts table may not exist yet, only saved to birth_charts');
    }

    return NextResponse.json({
      success: true,
      chart: chartData,
      interpretation,
      chartId: oldResult.rows[0].id
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
 * @swagger
 * /api/birth-chart:
 *   get:
 *     summary: Fetch the user's saved birth chart.
 *     description: Retrieves the authenticated user's primary birth chart from the database.
 *     responses:
 *       200:
 *         description: Birth chart retrieved successfully.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Failed to fetch birth chart.
 */
export async function GET(req) {
  try {
    const authResult = await getAuthenticatedUser(req.cookies, authOptions);
    
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { userId } = authResult;

    let result = await pool.query(
      'SELECT * FROM natal_charts WHERE user_id = $1 AND is_primary = true ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

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

    let chartData;
    if (savedChart.natal_positions) {
      chartData = {
        planets: savedChart.natal_positions,
        houses: savedChart.houses,
        aspects: savedChart.aspects,
        ascendant: savedChart.ascendant,
        midheaven: savedChart.midheaven,
        distribution: savedChart.distribution,
        partOfFortune: savedChart.part_of_fortune,
        chartRuler: savedChart.chart_ruler
      };
    } else {
      const chart = savedChart.chart_data;
      chartData = typeof chart === 'string' ? JSON.parse(chart) : chart;
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
