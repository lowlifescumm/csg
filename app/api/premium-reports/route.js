import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/db';

/**
 * GET /api/premium-reports
 * Get all premium reports for the authenticated user
 */
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT 
        id,
        report_type,
        report_name,
        amount_paid,
        status,
        report_pdf_url,
        error_message,
        created_at,
        completed_at
       FROM premium_report_orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [decoded.userId]
    );

    return NextResponse.json({
      success: true,
      reports: result.rows.map((report) => ({
        id: report.id,
        reportType: report.report_type,
        reportName: report.report_name,
        amountPaid: report.amount_paid / 100, // Convert cents to dollars
        status: report.status,
        pdfUrl: report.report_pdf_url,
        errorMessage: report.error_message,
        createdAt: report.created_at,
        completedAt: report.completed_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching premium reports:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

