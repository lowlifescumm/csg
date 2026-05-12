/**
 * GET /api/jobs/[jobId]
 * Get job status and results
 */

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth-config';
import { getJobById } from '@/lib/reading-jobs.js';
import { pool } from '@/lib/db.js';
import { serializeJob } from '@/lib/reading-jobs.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Get job status
 */
export async function GET(request, { params }) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { userId } = authResult;
    const { jobId } = params;
    
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }
    
    // Get job
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    
    // Verify job belongs to user
    if (job.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get reading result if available
    let result = null;
    if (job.reading_id) {
      const { rows } = await pool.query(
        'SELECT * FROM reading_results WHERE id = $1',
        [job.reading_id]
      );
      result = rows[0] || null;
    }
    
    // Serialize job
    const jobData = serializeJob(job);
    
    return NextResponse.json({
      job: {
        ...jobData,
        progress_percent: job.progress_percent || 0,
        progress_message: job.progress_message || null,
      },
      result: result ? {
        id: result.id,
        status: result.status,
        content_json: result.content_json,
        pdf_url: result.pdf_url,
        download_url: result.id ? `/api/reports/${result.id}/download` : null,
        html_url: result.id ? `/api/reports/${result.id}/download?format=html` : null,
        progress_percent: result.progress_percent,
        progress_message: result.progress_message,
        error_message: result.error_message,
        created_at: result.created_at,
        updated_at: result.updated_at,
        completed_at: result.completed_at,
      } : null,
    });
    
  } catch (error) {
    logger.error('[JobStatus] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
    }, { status: 500 });
  }
}

