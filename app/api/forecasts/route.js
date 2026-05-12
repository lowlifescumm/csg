import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/auth-config';
import { getAuthenticatedUser } from '@/lib/auth';
import { getUserForecasts } from '@/lib/forecast-engine.js';
import { canAccessReading, consumeCreditsForReading } from '@/lib/access-control.js';
import { formatCreditError } from '@/lib/credit-error-handler.js';

/**
 * GET /api/forecasts
 * Return forecasts for the authenticated user.
 * Query params:
 *  - range: 7d|30d|90d (defaults to 7d)
 *  - type: daily|weekly (optional filter)
 */
export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);

    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = authResult;
    const searchParams = req.nextUrl?.searchParams;
    const range = searchParams?.get('range') || '7d';
    const typeFilter = searchParams?.get('type');

    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const daysBack = daysMap[range] || 7;
    const readingType = typeFilter === 'weekly' ? 'WEEKLY_FORECAST' : 'DAILY_FORECAST';

    const accessCheck = await canAccessReading(userId, readingType);
    if (!accessCheck.allowed) {
      if (accessCheck.reason === 'insufficient_credits') {
        return NextResponse.json({
          error: 'Insufficient credits',
          details: `${typeFilter === 'weekly' ? 'Weekly' : 'Daily'} Forecast requires ${accessCheck.required} credits`,
          cost: accessCheck.required,
        }, { status: 402 });
      }
      return NextResponse.json({ error: 'Access denied', details: accessCheck.reason }, { status: 403 });
    }

    const creditResult = await consumeCreditsForReading(userId, readingType);
    if (!creditResult.success) {
      const errorResponse = formatCreditError(creditResult);
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }

    let forecasts = await getUserForecasts(userId, daysBack);

    if (typeFilter) {
      forecasts = forecasts.filter((f) => f.forecast_type === typeFilter);
    }

    const normalized = forecasts.map((forecast) => ({
      ...forecast,
      transit_summary: typeof forecast.transit_summary === 'string'
        ? JSON.parse(forecast.transit_summary)
        : forecast.transit_summary,
      suggested_actions: typeof forecast.suggested_actions === 'string'
        ? JSON.parse(forecast.suggested_actions)
        : forecast.suggested_actions,
      rituals: typeof forecast.rituals === 'string'
        ? JSON.parse(forecast.rituals)
        : forecast.rituals,
    }));

    return NextResponse.json({
      forecasts: normalized,
      count: normalized.length,
      range,
    });
  } catch (error) {
    logger.error('Error fetching forecasts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forecasts', details: error.message },
      { status: 500 },
    );
  }
}

