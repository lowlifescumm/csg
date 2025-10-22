import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { pool } from '@/lib/db.js';
import { calculateBirthChart } from '@/lib/astrology.js';

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
