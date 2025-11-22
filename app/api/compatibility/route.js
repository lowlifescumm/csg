import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateCompatibilityReport } from '@/lib/compatibility';
import { calculateBirthChart } from '@/lib/astrology';
import { pool } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { canAccessReading, consumeCreditsForReading } from '@/lib/access-control.js';
import { formatCreditError } from '@/lib/credit-error-handler.js';


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

    const date1 = new Date(person1BirthDate);
    const chart1 = calculateBirthChart(date1, person1BirthTime, parseFloat(person1Latitude), parseFloat(person1Longitude));

    const date2 = new Date(person2BirthDate);
    const chart2 = calculateBirthChart(date2, person2BirthTime, parseFloat(person2Latitude), parseFloat(person2Longitude));

    console.log('Generating compatibility report...');
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
        JSON.stringify(chart1),
        JSON.stringify(chart2),
        person1Name || 'Person 1',
        person2Name || 'Person 2',
        JSON.stringify(result.scores),
        result.report
      ]
    );

    const reportId = insertResult.rows[0].id;

    return NextResponse.json({
      success: true,
      scores: result.scores,
      report: result.report,
      insights: result.insights
    });

  } catch (error) {
    console.error('Compatibility report error:', error);
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
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
