const logger = require('../../../lib/logger');
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth-config';
import { pool } from '@/lib/db.js';
import { interpretBirthChart } from '@/lib/astrology.js';
import { canAccessReading, consumeCreditsForReading } from '@/lib/access-control.js';
import { formatCreditError } from '@/lib/credit-error-handler.js';
import { getAuthenticatedUser } from '@/lib/auth.js';

/**
 * POST /api/birth-chart/interpretation
 * Generate AI interpretation for existing birth chart (costs credits)
 */
export async function POST(req) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser(req.cookies, authOptions);
    
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { userId } = authResult;

    // Check access permissions for Natal Chart interpretation
    const accessCheck = await canAccessReading(userId, 'NATAL_CHART');
    
    if (!accessCheck.allowed) {
      if (accessCheck.reason === 'insufficient_credits') {
        return NextResponse.json({
          error: 'Insufficient credits',
          details: `Interpretation requires ${accessCheck.required} credits`,
          cost: accessCheck.required
        }, { status: 402 }); // Payment Required
      }
      return NextResponse.json({
        error: 'Access denied',
        details: accessCheck.reason
      }, { status: 403 });
    }

    // Get user's existing birth chart
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
        error: 'No birth chart found',
        details: 'Please create a birth chart first'
      }, { status: 404 });
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
      // Old format
      const chart = savedChart.chart_data;
      chartData = typeof chart === 'string' ? JSON.parse(chart) : chart;
    }

    // Generate AI interpretation
    let interpretation = '';
    if (process.env.OPENAI_API_KEY) {
      try {
        interpretation = await interpretBirthChart(chartData);
      } catch (error) {
        logger.error('Failed to generate interpretation:', error);
        return NextResponse.json({
          error: 'Failed to generate interpretation',
          details: error.message
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({
        error: 'Interpretation service unavailable',
        details: 'OpenAI API key not configured'
      }, { status: 503 });
    }

    // Consume credits for the interpretation
    const creditResult = await consumeCreditsForReading(userId, 'NATAL_CHART');
    
    if (!creditResult.success) {
      const errorResponse = formatCreditError(creditResult);
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }

    // Update interpretation in database
    try {
      // Update new table
      await pool.query(
        `UPDATE natal_charts SET interpretation = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [interpretation, savedChart.id]
      );
    } catch (error) {
      // Fallback to old table
      await pool.query(
        `UPDATE birth_charts SET interpretation = $1 WHERE id = $2`,
        [interpretation, savedChart.id]
      );
    }

    return NextResponse.json({
      success: true,
      interpretation
    });

  } catch (error) {
    logger.error('Error generating interpretation:', error);
    return NextResponse.json({ 
      error: 'Failed to generate interpretation',
      details: error.message
    }, { status: 500 });
  }
}
