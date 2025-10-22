import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { pool } from '@/lib/db.js';
import { 
  generateForecast, 
  saveForecast, 
  getForecastPreferences 
} from '@/lib/forecast-engine.js';

/**
 * POST /api/forecasts/generate
 * Generate a new forecast for the authenticated user
 * 
 * Query params:
 * - date: YYYY-MM-DD (optional, defaults to today)
 * - length: short|medium|long (optional, uses user preference)
 * - type: daily|weekly (optional, defaults to daily)
 */
export async function POST(req) {
  try {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Get query params
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const lengthParam = searchParams.get('length');
    const typeParam = searchParams.get('type') || 'daily';

    // Parse date
    const forecastDate = dateParam ? new Date(dateParam) : new Date();
    if (isNaN(forecastDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // Get user preferences
    const prefs = await getForecastPreferences(userId);

    // Check if user has permission (premium feature for AI rewrite)
    const userResult = await pool.query(
      'SELECT role, stripe_subscription_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];
    const isAdmin = user.role === 'admin';
    const isPremium = user.stripe_subscription_id !== null && user.stripe_subscription_id !== '';

    // AI rewrite is premium only
    const aiRewrite = (isAdmin || isPremium) && prefs.ai_rewrite_enabled;

    // Generate forecast
    const forecast = await generateForecast(userId, forecastDate, {
      type: typeParam,
      length: lengthParam || prefs.default_length,
      tone: prefs.tone,
      topics: prefs.topics,
      includeActions: prefs.include_actions,
      aiRewrite,
    });

    // Save to database
    const forecastId = await saveForecast(forecast);

    return NextResponse.json({
      success: true,
      forecast: {
        id: forecastId,
        ...forecast,
      },
    });
  } catch (error) {
    console.error('Forecast generation error:', error);
    
    if (error.message === 'No natal chart found for user') {
      return NextResponse.json({ 
        error: error.message,
        needsBirthChart: true,
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to generate forecast',
      details: error.message,
    }, { status: 500 });
  }
}

