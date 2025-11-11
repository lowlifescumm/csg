import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserForecasts } from '@/lib/forecast-engine.js';
import { getAuthenticatedUser } from '@/lib/auth';
import { canAccessReading, consumeCreditsForReading } from '@/lib/access-control.js';

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
    // Get authenticated user (supports both NextAuth and JWT)
    const authResult = await getAuthenticatedUser(req.cookies, authOptions);
    
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { userId } = authResult;

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

    // Determine reading type based on request
    const readingType = typeFilter === 'weekly' ? 'WEEKLY_FORECAST' : 'DAILY_FORECAST';

    // Check access permissions
    const accessCheck = await canAccessReading(userId, readingType);
    
    if (!accessCheck.allowed) {
      if (accessCheck.reason === 'insufficient_credits') {
        return NextResponse.json({
          error: 'Insufficient credits',
          details: `${typeFilter === 'weekly' ? 'Weekly' : 'Daily'} Forecast requires ${accessCheck.required} credits`,
          cost: accessCheck.required
        }, { status: 402 });
      }
      return NextResponse.json({
        error: 'Access denied',
        details: accessCheck.reason
      }, { status: 403 });
    }

    // Consume credits for the reading (if not subscription-included)
    const creditResult = await consumeCreditsForReading(userId, readingType);
    
    if (!creditResult.success) {
      return NextResponse.json({
        error: 'Credit processing failed',
        details: creditResult.message,
        cost: creditResult.cost
      }, { status: 402 });
    }

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



