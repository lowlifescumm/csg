import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { pool } from '@/lib/db.js';
import { calculateBirthChart, interpretBirthChart } from '@/lib/astrology.js';

/**
 * POST /api/birth-chart
 * Create a new birth chart
 */
export async function POST(req) {
  try {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const body = await req.json();
    const { date, time, location, latitude, longitude } = body;

    if (!date || !time || !location || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Date, time, location, latitude, and longitude are all required'
      }, { status: 400 });
    }

    // Calculate birth chart
    const chartData = calculateBirthChart(date, time, latitude, longitude);

    // Generate AI interpretation
    let interpretation = '';
    if (process.env.OPENAI_API_KEY) {
      try {
        interpretation = await interpretBirthChart(chartData);
      } catch (error) {
        console.error('Failed to generate interpretation:', error);
        interpretation = 'Interpretation generation failed. Your chart data is still saved.';
      }
    }

    // Save to both tables for compatibility
    
    // 1. Save to old birth_charts table
    const oldResult = await pool.query(
      `INSERT INTO birth_charts 
        (user_id, birth_date, birth_time, location, latitude, longitude, chart_data, interpretation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [userId, date, time, location, latitude, longitude, JSON.stringify(chartData), interpretation]
    );

    // 2. Save to new natal_charts table if it exists
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
          'UTC', // Default timezone
          JSON.stringify(chartData.planets),
          JSON.stringify(chartData.houses),
          JSON.stringify(chartData.aspects),
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
 * GET /api/birth-chart
 * Fetch the user's saved birth chart
 */
export async function GET(req) {
  try {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

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

    // Parse chart data
    let chartData;
    if (savedChart.natal_positions) {
      // New format
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
      // Old format - recalculate
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
