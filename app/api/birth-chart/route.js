import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth-config';
import { pool } from '@/lib/db.js';
import { interpretBirthChart, calculateBirthChart } from '@/lib/astrology.js';
import { canAccessReading, consumeCreditsForReading, claimFreeNatalChart } from '@/lib/access-control.js';
import { formatCreditError } from '@/lib/credit-error-handler.js';
import { getAuthenticatedUser } from '@/lib/auth.js';
import { hydrateReportData } from '@/src/services/chartHydrator';
import logger from '@/lib/logger';

export async function POST(req) {
  try {
    const cookieStore = req.cookies;
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);
    if (!authResult) {
      return NextResponse.json({ error: 'Authentication required', details: 'Create an account or sign in to generate and save your birth chart.' }, { status: 401 });
    }

    const { userId } = authResult;
    const body = await req.json();
    const { date, time, location, latitude, longitude, generateInterpretation } = body;

    if (!date || !time || !location || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Missing required fields', details: 'Date, time, location, latitude, and longitude are all required' }, { status: 400 });
    }

    const latNumber = typeof latitude === 'number' ? latitude : parseFloat(latitude);
    const lonNumber = typeof longitude === 'number' ? longitude : parseFloat(longitude);

    let chartData;
    const HYDRATION_TIMEOUT_MS = 15000;
    try {
      const hydrated = await Promise.race([
        hydrateReportData({ name: body.name || 'Primary Chart', birthDate: date, birthTime: time, birthCity: location, birthLatitude: latNumber, birthLongitude: lonNumber }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Birth chart generation timed out. Please try again.')), HYDRATION_TIMEOUT_MS)),
      ]);
      chartData = hydrated.rawChart;
    } catch (error) {
      logger.error('Error calculating chart:', error);
      chartData = calculateBirthChart(date, time, latNumber, lonNumber);
    }

    let interpretation = '';
    if (generateInterpretation) {
      const accessCheck = await canAccessReading(userId, 'NATAL_CHART');
      if (!accessCheck.allowed) {
        if (accessCheck.reason === 'insufficient_credits') {
          return NextResponse.json({ error: 'Insufficient credits', details: `Interpretation requires ${accessCheck.required} credits`, cost: accessCheck.required, chart: chartData }, { status: 402 });
        }
        return NextResponse.json({ error: 'Access denied', details: accessCheck.reason }, { status: 403 });
      }

      if (process.env.OPENAI_API_KEY) {
        try {
          interpretation = await interpretBirthChart(chartData);
        } catch (error) {
          logger.error('Failed to generate interpretation:', error);
          interpretation = 'Interpretation generation failed. Your chart data is still saved.';
        }
      }

      const creditResult = await consumeCreditsForReading(userId, 'NATAL_CHART');
      if (!creditResult.success) {
        const errorResponse = formatCreditError(creditResult);
        return NextResponse.json({ ...errorResponse, chart: chartData }, { status: errorResponse.status });
      }

      if (accessCheck.reason === 'subscription_included') {
        const freeChartResult = await claimFreeNatalChart(userId);
        if (freeChartResult.success) {
          logger.info(`[Birth Chart] Free natal chart claimed for user ${userId}`);
        }
      }
    }

    const oldResult = await pool.query(`INSERT INTO birth_charts (user_id, birth_date, birth_time, location, latitude, longitude, chart_data, interpretation) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`, [userId, date, time, location, latNumber, lonNumber, JSON.stringify(chartData), interpretation]);
    try {
      await pool.query(`INSERT INTO natal_charts (user_id, name, birth_date, birth_time, location, latitude, longitude, timezone, natal_positions, houses, aspects, ascendant, midheaven, interpretation, is_primary, distribution, part_of_fortune, chart_ruler, dignities, moon_phase, chart_patterns, planet_houses) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) ON CONFLICT (user_id, name) DO UPDATE SET birth_date = EXCLUDED.birth_date, birth_time = EXCLUDED.birth_time, location = EXCLUDED.location, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, natal_positions = EXCLUDED.natal_positions, houses = EXCLUDED.houses, aspects = EXCLUDED.aspects, ascendant = EXCLUDED.ascendant, midheaven = EXCLUDED.midheaven, interpretation = EXCLUDED.interpretation, updated_at = CURRENT_TIMESTAMP`, [userId, 'Primary Chart', date, time, location, latNumber, lonNumber, 'UTC', JSON.stringify({ ...chartData.planets, _premium_data: { planetSignHouseCombinations: chartData.planetSignHouseCombinations || [], houseCuspsDetailed: chartData.houseCuspsDetailed || [], chartRulerLocation: chartData.chartRulerLocation || null, majorAspects: chartData.majorAspects || [], midpoints: chartData.midpoints || [] } }), JSON.stringify({ ...chartData.houses, _cusps_detailed: chartData.houseCuspsDetailed || [] }), JSON.stringify({ all: chartData.aspects || [], major: chartData.majorAspects || [] }), chartData.ascendant, chartData.midheaven, interpretation, true, JSON.stringify(chartData.distribution), JSON.stringify(chartData.partOfFortune), chartData.chartRuler, JSON.stringify(chartData.dignities || {}), JSON.stringify(chartData.moonPhase || {}), JSON.stringify(chartData.chartPatterns || []), JSON.stringify({ ...chartData.planetHouses || {}, _combinations: chartData.planetSignHouseCombinations || [] })]);
    } catch (error) {
      logger.info('Note: natal_charts table may not exist yet, only saved to birth_charts');
    }

    return NextResponse.json({ success: true, chart: chartData, interpretation: interpretation || null, chartId: oldResult.rows[0].id, hasInterpretation: !!interpretation, isPreview: false, saved: true });
  } catch (error) {
    logger.error('Error in birth-chart route:', error);
    return NextResponse.json({ error: 'Birth chart generation failed', details: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const authResult = await getAuthenticatedUser(req.cookies, authOptions);
    if (!authResult) {
      return NextResponse.json({ hasChart: false, error: 'Authentication required', message: 'Please sign in to view your saved birth chart.' }, { status: 401 });
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
      return NextResponse.json({ hasChart: false, message: 'No birth chart found. Please create one first.' });
    }

    const savedChart = result.rows[0];

    let chartData;
    if (savedChart.natal_positions) {
      const natalPositions = typeof savedChart.natal_positions === 'string' ? JSON.parse(savedChart.natal_positions) : savedChart.natal_positions;
      const premiumData = natalPositions._premium_data || {};
      const planets = { ...natalPositions };
      delete planets._premium_data;
      const houses = typeof savedChart.houses === 'string' ? JSON.parse(savedChart.houses) : savedChart.houses || {};
      chartData = {
        planets,
        houses,
        ascendant: savedChart.ascendant,
        midheaven: savedChart.midheaven,
        distribution: savedChart.distribution ? (typeof savedChart.distribution === 'string' ? JSON.parse(savedChart.distribution) : savedChart.distribution) : undefined,
        partOfFortune: savedChart.part_of_fortune ? (typeof savedChart.part_of_fortune === 'string' ? JSON.parse(savedChart.part_of_fortune) : savedChart.part_of_fortune) : undefined,
        chartRuler: savedChart.chart_ruler || undefined,
        dignities: savedChart.dignities ? (typeof savedChart.dignities === 'string' ? JSON.parse(savedChart.dignities) : savedChart.dignities) : undefined,
        moonPhase: savedChart.moon_phase ? (typeof savedChart.moon_phase === 'string' ? JSON.parse(savedChart.moon_phase) : savedChart.moon_phase) : undefined,
        chartPatterns: savedChart.chart_patterns ? (typeof savedChart.chart_patterns === 'string' ? JSON.parse(savedChart.chart_patterns) : savedChart.chart_patterns) : undefined,
        aspects: savedChart.aspects ? (typeof savedChart.aspects === 'string' ? JSON.parse(savedChart.aspects) : savedChart.aspects) : undefined,
        planetHouses: savedChart.planet_houses ? (typeof savedChart.planet_houses === 'string' ? JSON.parse(savedChart.planet_houses) : savedChart.planet_houses) : undefined,
        planetSignHouseCombinations: premiumData.planetSignHouseCombinations || [],
        houseCuspsDetailed: premiumData.houseCuspsDetailed || houses?._cusps_detailed || [],
        chartRulerLocation: premiumData.chartRulerLocation || null,
        majorAspects: premiumData.majorAspects || undefined,
        midpoints: premiumData.midpoints || []
      };
    } else {
      const chart = typeof savedChart.chart_data === 'string' ? JSON.parse(savedChart.chart_data) : savedChart.chart_data;
      chartData = chart || {};
    }

    const birthInfo = {
      date: savedChart.birth_date || savedChart.birthDate,
      time: savedChart.birth_time || savedChart.birthTime,
      location: savedChart.location || savedChart.location_name,
      latitude: savedChart.latitude,
      longitude: savedChart.longitude
    };

    return NextResponse.json({ hasChart: true, chart: chartData, birthInfo, interpretation: savedChart.interpretation || null, chartId: savedChart.id });
  } catch (error) {
    logger.error('Error fetching birth chart:', error);
    return NextResponse.json({ error: 'Failed to fetch birth chart', details: error.message }, { status: 500 });
  }
}
