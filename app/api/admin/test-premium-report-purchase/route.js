import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/db';
import { PREMIUM_REPORTS, getPremiumReportById } from '@/lib/pricing';

/**
 * Admin endpoint to test premium report purchase flow
 * POST /api/admin/test-premium-report-purchase
 * 
 * Body: {
 *   reportId: 'ESSENTIAL' | 'ADVANCED' | 'MASTER'
 *   userId: optional - defaults to authenticated user
 * }
 * 
 * This simulates a purchase without going through Stripe
 */
export async function POST(request) {
  try {
    // Authenticate user - admin only
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { rows: userRows } = await pool.query(
      "SELECT id, email, first_name, last_name, role FROM users WHERE id=$1",
      [decoded.userId]
    );
    
    if (!userRows[0] || userRows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const authUser = userRows[0];

    const body = await request.json();
    const { reportId, userId, partnerData, skipPartnerData } = body;

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const report = getPremiumReportById(reportId);
    if (!report) {
      return NextResponse.json({ error: `Invalid report ID: ${reportId}` }, { status: 400 });
    }

    // Validate partner data for Advanced/Master reports (same as checkout API)
    const skipPartner = skipPartnerData === true;
    if ((reportId === 'ADVANCED' || reportId === 'MASTER') && !skipPartner) {
      if (!partnerData) {
        return NextResponse.json({
          error: 'Partner data required',
          message: 'Partner information is required for compatibility sections. Please provide partner data or set skipPartnerData to true.',
          requiresPartnerData: true
        }, { status: 400 });
      }

      // Validate partner data has required fields
      if (!partnerData.birthDate || !partnerData.birthTime || 
          partnerData.latitude === undefined || partnerData.longitude === undefined) {
        return NextResponse.json({
          error: 'Incomplete partner data',
          message: 'Partner data is incomplete. Please provide birth date, birth time, and location coordinates.',
          requiresPartnerData: true
        }, { status: 400 });
      }
    }

    // Use provided userId or default to authenticated user
    const targetUserId = userId || authUser.id;

    // Get user info
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
      [targetUserId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Create a test order (simulating Stripe purchase)
    const testSessionId = `test_session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Prepare partner data for storage (if provided)
    const partnerDataJson = partnerData && !skipPartner ? JSON.stringify(partnerData) : null;
    const skipPartnerFlag = skipPartner || false;
    
    const orderResult = await pool.query(
      `INSERT INTO premium_report_orders 
       (user_id, report_type, report_name, stripe_session_id, stripe_customer_id, amount_paid, status, partner_data, skip_partner_data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, NOW())
       RETURNING id`,
      [
        targetUserId,
        reportId.toUpperCase(),
        report.name,
        testSessionId,
        `test_customer_${targetUserId}`,
        report.priceInCents,
        partnerDataJson,
        skipPartnerFlag
      ]
    );

    const orderId = orderResult.rows[0].id;

    console.log(`[Test Purchase] Created test order ${orderId} for user ${targetUserId}, report ${reportId}`);

    // Trigger report generation
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:5000');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      // Trigger generation in background
      fetch(`${baseUrl}/api/premium-reports/generate-internal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cronSecret}`
        },
        body: JSON.stringify({ orderId }),
      }).catch(err => {
        console.error(`[Test Purchase] Failed to trigger generation for order ${orderId}:`, err);
      });
    } else {
      console.warn(`[Test Purchase] CRON_SECRET not set, generation will need to be triggered manually`);
    }

    return NextResponse.json({
      success: true,
      message: 'Test purchase created successfully',
      order: {
        id: orderId,
        reportType: reportId,
        reportName: report.name,
        userId: targetUserId,
        userEmail: user.email,
        status: 'pending',
        amountPaid: report.priceInCents / 100,
      },
      nextSteps: [
        'Report generation has been triggered automatically',
        `View the order at /premium-reports`,
        `Or check the database: SELECT * FROM premium_report_orders WHERE id = ${orderId}`,
        cronSecret ? 'Generation should complete automatically' : 'Manually trigger generation using the generate endpoint'
      ]
    });
  } catch (error) {
    console.error('Test purchase error:', error);
    console.error('Error stack:', error.stack);
    
    // Check if it's a table doesn't exist error
    if (error.message && error.message.includes('premium_report_orders')) {
      return NextResponse.json(
        { 
          error: 'Database table not found', 
          details: 'The premium_report_orders table does not exist. Please run the migration: csg/database/add-premium-report-orders.sql',
          migrationFile: 'csg/database/add-premium-report-orders.sql'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create test purchase', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

