/**
 * GET /api/reports
 * List authenticated user's purchased reports with generation status
 */

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth-config';
import { pool } from '@/lib/db.js';
import logger from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = authResult;

    const { rows } = await pool.query(
      `SELECT
        rp.id as purchase_id,
        rp.report_type,
        rp.amount,
        rp.status as purchase_status,
        rp.created_at as purchased_at,
        rr.id as result_id,
        rr.status as result_status,
        rr.reading_type,
        rr.completed_at,
        rr.progress_percent,
        rr.progress_message,
        rr.error_message,
        rj.id as job_id,
        rj.status as job_status
      FROM report_purchases rp
      LEFT JOIN reading_jobs rj ON rj.user_id = rp.user_id AND rj.reading_type = LOWER(rp.report_type)
      LEFT JOIN reading_results rr ON rr.id = rj.reading_id
      WHERE rp.user_id = $1
      ORDER BY rp.created_at DESC`,
      [userId]
    );

    const reports = rows.map(row => {
      const resultStatus = row.result_status || row.job_status || row.purchase_status;
      let displayStatus = 'pending';
      if (resultStatus === 'completed' || resultStatus === 'succeeded') displayStatus = 'completed';
      else if (resultStatus === 'queued' || resultStatus === 'processing') displayStatus = 'generating';
      else if (resultStatus === 'failed') displayStatus = 'failed';
      else if (resultStatus === 'paid') displayStatus = 'pending';

      return {
        purchaseId: row.purchase_id,
        reportType: row.report_type,
        amount: row.amount,
        purchasedAt: row.purchased_at,
        status: displayStatus,
        resultId: row.result_id,
        completedAt: row.completed_at,
        progressPercent: row.progress_percent,
        progressMessage: row.progress_message,
        errorMessage: row.error_message,
        viewUrl: row.result_id ? `/reports/${row.result_id}` : null,
        downloadUrl: row.result_id ? `/api/reports/${row.result_id}/download` : null,
      };
    });

    return NextResponse.json({ reports });
  } catch (error) {
    logger.error('[ReportsList] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
