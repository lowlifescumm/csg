/**
 * GET /api/reports/[resultId]/download
 * Download report as PDF/HTML
 */

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { pool } from '@/lib/db.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Download report
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
    
    // Get reading result
    const { rows } = await pool.query(
      `SELECT rr.*, rj.reading_type, rj.options
       FROM reading_results rr
       JOIN reading_jobs rj ON rr.reading_job_id = rj.id
       WHERE rr.id = $1 AND rj.user_id = $2`,
      [resultId, userId]
    );
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    
    const result = rows[0];
    const contentJson = typeof result.content_json === 'string' 
      ? JSON.parse(result.content_json) 
      : result.content_json;
    
    // Check if HTML is stored in content_json
    let html = contentJson.html || contentJson.content_html;
    
    // If no HTML, generate it from content
    if (!html && contentJson.content) {
      const { generateHTMLReport } = await import('@/lib/pdf-generator.js');
      const reportType = result.reading_type;
      const reportData = {
        name: contentJson.name || contentJson.user_name,
        ...contentJson,
      };
      
      html = generateHTMLReport(reportType, reportData, {
        content: contentJson.content,
        sections: contentJson.sections,
      });
    }
    
    if (!html) {
      return NextResponse.json({ error: 'Report HTML not available' }, { status: 404 });
    }
    
    // Return HTML with proper headers for download
    const format = request.nextUrl?.searchParams?.get('format') || 'html';
    const filename = `cosmic-report-${result.reading_type}-${resultId}.${format === 'pdf' ? 'pdf' : 'html'}`;
    
    if (format === 'pdf') {
      // For now, return HTML with print-to-PDF styling
      // In production, you'd use Puppeteer or similar to generate actual PDF
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else {
      // Return HTML
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }
    
  } catch (error) {
    console.error('[ReportDownload] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
    }, { status: 500 });
  }
}

