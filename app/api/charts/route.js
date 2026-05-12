const logger = require('../../lib/logger');
/**
 * Natal Charts API
 * POST /api/charts - Create a new natal chart
 * GET /api/charts - List user's natal charts
 */

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { pool } from '@/lib/db.js';
import { calculateBirthChart } from '@/lib/astrology.js';
import { calculateAndStoreTransits } from '@/lib/transit-engine.js';

/**
 * POST /api/charts
 * Create a new natal chart for the authenticated user
 * 
 * Body:
 * {
 *   "birthDate": "1990-06-15",
 *   "birthTime": "14:30",
 *   "timezone": "America/New_York",
 *   "latitude": 40.7128,
 *   "longitude": -74.0060,
 *   "locationName": "New York, NY",
 *   "chartName": "My Birth Chart" (optional),
 *   "isPrimary": true (optional)
 * }
 */
export async function POST(req) {
  try {
    // Authenticate user
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Get user info
    const { rows: userRows } = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [userId]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userRows[0];

    // Parse request body
    const body = await req.json();
    const {
      birthDate,
      birthTime,
      timezone,
      latitude,
      longitude,
      locationName,
      chartName,
      isPrimary = true
    } = body;

    // Validate required fields
    if (!birthDate || !birthTime || !timezone || latitude === undefined || longitude === undefined) {
      return NextResponse.json({
        error: 'Missing required fields',
        required: ['birthDate', 'birthTime', 'timezone', 'latitude', 'longitude']
      }, { status: 400 });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({
        error: 'Invalid coordinates',
        details: 'Latitude must be between -90 and 90, longitude between -180 and 180'
      }, { status: 400 });
    }

    // Calculate natal chart using existing astrology library
    let chartData;
    try {
      chartData = calculateBirthChart(birthDate, birthTime, latitude, longitude);
    } catch (error) {
      return NextResponse.json({
        error: 'Failed to calculate birth chart',
        details: error.message
      }, { status: 500 });
    }

    // Create combined datetime with timezone
    const [year, month, day] = birthDate.split('-').map(Number);
    const [hours, minutes] = birthTime.split(':').map(Number);
    const birthDateTime = new Date(year, month - 1, day, hours, minutes, 0);

    // Convert natal positions to database format (include premium data points)
    const natalPositions = {};
    for (const [planet, data] of Object.entries(chartData.planets)) {
      natalPositions[planet] = {
        longitude: data.longitude,
        sign: data.sign,
        degree: data.degree,
        name: planet.charAt(0).toUpperCase() + planet.slice(1)
      };
    }
    
    // Add premium data points to natal_positions JSONB
    natalPositions._premium_data = {
      planetSignHouseCombinations: chartData.planetSignHouseCombinations || [],
      houseCuspsDetailed: chartData.houseCuspsDetailed || [],
      chartRulerLocation: chartData.chartRulerLocation || null,
      majorAspects: chartData.majorAspects || [],
      midpoints: chartData.midpoints || []
    };

    // If this is set as primary, unset other primary charts
    if (isPrimary) {
      await pool.query(
        'UPDATE natal_charts SET is_primary = false WHERE user_id = $1 AND is_primary = true',
        [userId]
      );
    }

    // Insert natal chart into database (include premium data points)
    const { rows: chartRows } = await pool.query(
      `INSERT INTO natal_charts (
        user_id, birth_date, birth_time, timezone, latitude, longitude,
        location_name, natal_positions, houses, ascendant, midheaven,
        chart_name, is_primary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, created_at`,
      [
        userId,
        birthDateTime,
        birthTime,
        timezone,
        latitude,
        longitude,
        locationName || null,
        JSON.stringify(natalPositions), // Includes _premium_data
        JSON.stringify({
          ...chartData.houses,
          _cusps_detailed: chartData.houseCuspsDetailed || []
        }),
        JSON.stringify(chartData.ascendant),
        JSON.stringify(chartData.midheaven),
        chartName || 'Birth Chart',
        isPrimary
      ]
    );

    const chartId = chartRows[0].id;

    // Automatically calculate transits for the next 90 days in the background
    // Don't wait for this to complete
    setImmediate(async () => {
      try {
        await calculateAndStoreTransits(
          userId,
          chartId,
          { natal_positions: natalPositions, houses: chartData.houses },
          new Date(),
          90
        );
      } catch (error) {
        logger.error('Background transit calculation failed:', error);
      }
    });

    return NextResponse.json({
      success: true,
      chart: {
        id: chartId,
        userId: userId,
        chartData: {
          planets: chartData.planets,
          houses: chartData.houses,
          ascendant: chartData.ascendant,
          midheaven: chartData.midheaven
        },
        birthInfo: {
          date: birthDate,
          time: birthTime,
          timezone: timezone,
          location: {
            name: locationName,
            latitude,
            longitude
          }
        },
        createdAt: chartRows[0].created_at
      },
      message: 'Natal chart created successfully. Transits are being calculated in the background.'
    }, { status: 201 });

  } catch (error) {
    logger.error('Error creating natal chart:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({
      error: 'Failed to create natal chart',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * GET /api/charts
 * Get all natal charts for the authenticated user
 */
export async function GET(req) {
  try {
    // Authenticate user
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Get user's natal charts
    const { rows } = await pool.query(
      `SELECT 
        id, birth_date, birth_time, timezone, latitude, longitude,
        location_name, natal_positions, houses, ascendant, midheaven,
        chart_name, is_primary, created_at, updated_at
       FROM natal_charts
       WHERE user_id = $1
       ORDER BY is_primary DESC, created_at DESC`,
      [userId]
    );

    // Format response (include premium data points)
    const charts = rows.map(row => {
      const natalPositions = typeof row.natal_positions === 'string' 
        ? JSON.parse(row.natal_positions) 
        : row.natal_positions;
      
      const premiumData = natalPositions._premium_data || {};
      
      // Extract planets (excluding _premium_data)
      const planets = { ...natalPositions };
      delete planets._premium_data;
      
      const houses = typeof row.houses === 'string' 
        ? JSON.parse(row.houses) 
        : row.houses;
      
      const aspects = typeof row.aspects === 'string' 
        ? JSON.parse(row.aspects) 
        : row.aspects;
      
      return {
        id: row.id,
        chartName: row.chart_name,
        isPrimary: row.is_primary,
        birthInfo: {
          date: row.birth_date,
          time: row.birth_time,
          timezone: row.timezone,
          location: {
            name: row.location_name,
            latitude: row.latitude,
            longitude: row.longitude
          }
        },
        chartData: {
          planets,
          houses: houses || {},
          ascendant: row.ascendant,
          midheaven: row.midheaven,
          // Include premium data points
          planetSignHouseCombinations: premiumData.planetSignHouseCombinations || [],
          houseCuspsDetailed: premiumData.houseCuspsDetailed || houses?._cusps_detailed || [],
          chartRulerLocation: premiumData.chartRulerLocation || null,
          majorAspects: premiumData.majorAspects || aspects?.major || [],
          midpoints: premiumData.midpoints || []
        },
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    return NextResponse.json({
      success: true,
      charts,
      count: charts.length
    });

  } catch (error) {
    logger.error('Error fetching natal charts:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({
      error: 'Failed to fetch natal charts',
      details: error.message
    }, { status: 500 });
  }
}




