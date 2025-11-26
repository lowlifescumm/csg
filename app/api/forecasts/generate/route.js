import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pool } from '@/lib/db.js';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAuthenticatedUser } from '@/lib/auth';
import { generateForecast, saveForecast, getForecastPreferences } from '@/lib/forecast-engine.js';

/**
 * POST /api/forecasts/generate
 * Generates a forecast for the authenticated user.
 * Query params:
 *  - date: YYYY-MM-DD (optional)
 *  - length: short|medium|long (optional)
 *  - type: daily|weekly (defaults to daily)
 */
export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);

    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = authResult;
    const searchParams = req.nextUrl?.searchParams;
    const dateParam = searchParams?.get('date');
    const lengthParam = searchParams?.get('length');
    const typeParam = searchParams?.get('type') || 'daily';

    const forecastDate = dateParam ? new Date(dateParam) : new Date();
    if (isNaN(forecastDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const prefs = await getForecastPreferences(userId);

    const userResult = await pool.query(
      'SELECT role, stripe_subscription_id FROM users WHERE id = $1',
      [userId],
    );
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];
    const isAdmin = user.role === 'admin';
    const isPremium = Boolean(user.stripe_subscription_id);
    const aiRewrite = (isAdmin || isPremium) && prefs.ai_rewrite_enabled;

    const forecast = await generateForecast(userId, forecastDate, {
      type: typeParam,
      length: lengthParam || prefs.default_length,
      tone: prefs.tone,
      topics: prefs.topics,
      includeActions: prefs.include_actions,
      aiRewrite,
    });

    const forecastId = await saveForecast(forecast);
    const savedForecast = await pool.query(
      'SELECT * FROM forecasts WHERE id = $1',
      [forecastId],
    );

    const forecastData = savedForecast.rows[0];
    if (forecastData) {
      forecastData.transit_summary = typeof forecastData.transit_summary === 'string'
        ? JSON.parse(forecastData.transit_summary)
        : forecastData.transit_summary;
      forecastData.suggested_actions = typeof forecastData.suggested_actions === 'string'
        ? JSON.parse(forecastData.suggested_actions)
        : forecastData.suggested_actions;
      if (forecastData.rituals) {
        forecastData.rituals = typeof forecastData.rituals === 'string'
          ? JSON.parse(forecastData.rituals)
          : forecastData.rituals;
      }
    }

    return NextResponse.json({
      success: true,
      forecast: forecastData,
    });
  } catch (error) {
    console.error('Forecast generation error:', error);

    if (error.message === 'No natal chart found for user') {
      return NextResponse.json(
        { error: error.message, needsBirthChart: true },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate forecast', details: error.message },
      { status: 500 },
    );
  }
}


