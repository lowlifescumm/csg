import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getUserForecasts } from '@/lib/forecast-engine.js';

/**
 * GET /api/forecasts
 * Get forecasts for the authenticated user
 * 
 * Query params:
 * - range: 7d|30d|90d (optional, defaults to 7d)
 * - type: daily|weekly (optional, returns all types if not specified)
 */
export async function GET(req) {
  try {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Get query params
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d';
    const typeFilter = searchParams.get('type');

    // Parse range
    const daysMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
    };
    const daysBack = daysMap[range] || 7;

    // Get forecasts
    let forecasts = await getUserForecasts(userId, daysBack);

    // Filter by type if specified
    if (typeFilter) {
      forecasts = forecasts.filter(f => f.forecast_type === typeFilter);
    }

    // Parse JSON fields
    forecasts = forecasts.map(f => ({
      ...f,
      transit_summary: typeof f.transit_summary === 'string' 
        ? JSON.parse(f.transit_summary) 
        : f.transit_summary,
      suggested_actions: typeof f.suggested_actions === 'string'
        ? JSON.parse(f.suggested_actions)
        : f.suggested_actions,
      rituals: f.rituals && typeof f.rituals === 'string'
        ? JSON.parse(f.rituals)
        : f.rituals,
    }));

    return NextResponse.json({
      forecasts,
      count: forecasts.length,
      range,
    });
  } catch (error) {
    console.error('Error fetching forecasts:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch forecasts',
      details: error.message,
    }, { status: 500 });
  }
}



