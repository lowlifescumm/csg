import { NextResponse } from 'next/server';
import { generateCompatibilityReport } from '@/lib/compatibility';
import { calculateBirthChart } from '@/lib/astrology';
import { Pool } from 'pg';
import { verifyToken } from '@/lib/auth';
import { checkUserCredits, deductUserCredit, initializeUserCredits } from '../credits/route';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

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

    const token = request.cookies.get('auth_token')?.value;
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = decoded.userId;

    // Check if user is admin or has premium subscription
    const { rows: user } = await pool.query(
      'SELECT role, stripe_subscription_id FROM users WHERE id = $1',
      [userId]
    );

    const isAdmin = user[0]?.role === 'admin';
    const isPremium = user[0]?.stripe_subscription_id && user[0]?.stripe_subscription_id.length > 0;

    if (!isAdmin && !isPremium) {
      return NextResponse.json({ 
        error: 'Premium subscription required',
        requiresPayment: true,
        isPremium: false 
      }, { status: 402 });
    }

    // For premium users (non-admin), check and deduct credits
    if (!isAdmin && isPremium) {
      const { hasCredits, creditsRemaining, resetDate } = await checkUserCredits(userId, 'compatibility');
      
      if (!hasCredits) {
        return NextResponse.json({ 
          error: 'No compatibility credits available',
          requiresPayment: false,
          isPremium: true,
          creditsRemaining: 0,
          resetDate: resetDate
        }, { status: 402 });
      }
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

    // Deduct credit for non-admin premium users
    let creditsRemaining = null;
    if (!isAdmin && isPremium) {
      const deductResult = await deductUserCredit(
        userId, 
        'compatibility', 
        reportId,
        `Compatibility report for ${person1Name || 'Person 1'} & ${person2Name || 'Person 2'}`
      );
      
      if (!deductResult.success) {
        // Rollback the report if credit deduction fails
        await pool.query('DELETE FROM compatibility_reports WHERE id = $1', [reportId]);
        return NextResponse.json({ 
          error: 'Failed to deduct credit',
          requiresPayment: false
        }, { status: 500 });
      }
      
      creditsRemaining = deductResult.creditsRemaining;
    }

    return NextResponse.json({
      success: true,
      scores: result.scores,
      report: result.report,
      insights: result.insights,
      creditsRemaining: creditsRemaining
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
    const token = request.cookies.get('auth_token')?.value;
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = decoded.userId;

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
