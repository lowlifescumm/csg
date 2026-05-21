/**
 * GET /api/reports/[resultId]
 * Fetch a report result for in-browser viewing
 */

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth-config';
import { pool } from '@/lib/db.js';
import logger from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Get report result by ID
 */
export async function GET(request, { params }) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { userId } = authResult;
    const { resultId } = params;
    
    if (!resultId) {
      return NextResponse.json({ error: 'Result ID is required' }, { status: 400 });
    }
    
    // Get reading result with job info
    const { rows } = await pool.query(
      `SELECT rr.*, rj.reading_type, rj.options, rj.state as job_state
       FROM reading_results rr
       JOIN reading_jobs rj ON rr.reading_job_id = rj.id
       WHERE rr.id = $1 AND rr.user_id = $2`,
      [resultId, userId]
    );
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    const result = rows[0];
    
    return NextResponse.json({
      result: {
        id: result.id,
        status: result.status,
        content_json: result.content_json,
        pdf_url: result.pdf_url,
        download_url: result.id ? `/api/reports/${result.id}/download` : null,
        html_url: result.id ? `/api/reports/${result.id}/download?format=html` : null,
        reading_type: result.reading_type,
        job_state: result.job_state,
        progress_percent: result.progress_percent,
        progress_message: result.progress_message,
        error_message: result.error_message,
        created_at: result.created_at,
        updated_at: result.updated_at,
        completed_at: result.completed_at,
      }
    });
    
  } catch (error) {
    logger.error('[ReportView] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
    }, { status: 500 });
  }
}
