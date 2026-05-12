import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { generateCompatibilityReport } from '@/lib/compatibility';
import { pool } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { canAccessReading, consumeCreditsForReading } from '@/lib/access-control.js';
import { formatCreditError } from '@/lib/credit-error-handler.js';
import { hydrateReportData } from '@/src/services/chartHydrator';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limiter';


export async function POST(request) {
  try {
    const { 
      person1Name, 
      person1BirthDate, 
      person1BirthTime, 
      person1Latitude, 
      person1Longitude,
      person2Name, 
      person2BirthDate, 
      person2BirthTime, 
      person2Latitude, 
      person2Longitude 
    } = await request.json();

    if (!person1BirthDate || !person1BirthTime || !person1Latitude || !person1Longitude ||
        !person2BirthDate || !person2BirthTime || !person2Latitude || !person2Longitude) {
      return NextResponse.json(
        { error: 'All birth information required for both people' },
        { status: 400 }
      );
    }

    // Get authenticated user (supports both NextAuth and JWT)
    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);
    
    if (!authResult) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const { userId } = authResult;

    // Apply rate limiting: 5 req/min for free users, 20 req/min for premium
    const isPremium = authResult.role === 'premium' || authResult.role === 'admin';
    const rateLimitResult = checkRateLimit(getClientIdentifier(request, userId), isPremium ? 20 : 5, 60000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000) },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)) } }
      );
    }

    // Check access permissions for Compatibility Report
    const accessCheck = await canAccessReading(userId, 'COMPATIBILITY_REPORT');
    
    if (!accessCheck.allowed) {
      if (accessCheck.reason === 'insufficient_credits') {
        return NextResponse.json({
          error: 'Insufficient credits',
          details: `Compatibility Report requires ${accessCheck.required} credits`,
          cost: accessCheck.required
        }, { status: 402 });
      }
      return NextResponse.json({
        error: 'Access denied',
        details: accessCheck.reason
      }, { status: 403 });
    }

    const person1Lat = typeof person1Latitude === 'number' ? person1Latitude : parseFloat(person1Latitude);
    const person1Lon = typeof person1Longitude === 'number' ? person1Longitude : parseFloat(person1Longitude);
    const person2Lat = typeof person2Latitude === 'number' ? person2Latitude : parseFloat(person2Latitude);
    const person2Lon = typeof person2Longitude === 'number' ? person2Longitude : parseFloat(person2Longitude);

    const chart1Hydrated = await hydrateReportData({
      name: person1Name || 'Person 1',
      birthDate: person1BirthDate,
      birthTime: person1BirthTime,
      birthLatitude: person1Lat,
      birthLongitude: person1Lon,
    });

    const chart2Hydrated = await hydrateReportData({
      name: person2Name || 'Person 2',
      birthDate: person2BirthDate,
      birthTime: person2BirthTime,
      birthLatitude: person2Lat,
      birthLongitude: person2Lon,
    });

    const chart1 = chart1Hydrated.rawChart;
    const chart2 = chart2Hydrated.rawChart;

    logger.info('Generating compatibility report...');
    const result = await generateCompatibilityReport(
      chart1,
      chart2,
      person1Name || 'Person 1',
      person2Name || 'Person 2'
    );

    // Consume credits for the reading
    const creditResult = await consumeCreditsForReading(userId, 'COMPATIBILITY_REPORT');
    
    if (!creditResult.success) {
      const errorResponse = formatCreditError(creditResult);
      return NextResponse.json(errorResponse, { status: errorResponse.status });
    }

    const insertResult = await pool.query(
      `INSERT INTO compatibility_reports 
       (user_id, chart1_data, chart2_data, person1_name, person2_name, scores, report, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, NOW())
       RETURNING id`,
      [
        userId,
        JSON.stringify({
          ...chart1,
          // Include premium data points in chart1_data
          _premium_data: {
            synastryAspects: result.synastryAspects || [],
            houseOverlays: result.houseOverlays || [],
            compositeChart: result.compositeChart || null
          }
        }),
        JSON.stringify({
          ...chart2,
          // Include premium data points reference in chart2_data
          _premium_data_ref: true
        }),
        person1Name || 'Person 1',
        person2Name || 'Person 2',
        JSON.stringify({
          ...result.scores,
          // Include premium data in scores JSONB
          _premium_data: {
            synastryAspects: result.synastryAspects || [],
            houseOverlays: result.houseOverlays || [],
            compositeChart: result.compositeChart || null
          }
        }),
        result.report
      ]
    );

    const reportId = insertResult.rows[0].id;

    return NextResponse.json({
      success: true,
      scores: result.scores,
      report: result.report,
      insights: result.insights,
      // Include premium data points in response
      synastryAspects: result.synastryAspects,
      houseOverlays: result.houseOverlays,
      compositeChart: result.compositeChart
    });

  } catch (error) {
    logger.error('Compatibility report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get authenticated user (supports both NextAuth and JWT)
    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);
    
    if (!authResult) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const { userId } = authResult;

    const result = await pool.query(
      'SELECT * FROM compatibility_reports WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return NextResponse.json({
      success: true,
      reports: result.rows.map(report => ({
        id: report.id,
        person1Name: report.person1_name,
        person2Name: report.person2_name,
        scores: report.scores,
        createdAt: report.created_at
      }))
    });

  } catch (error) {
    logger.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
