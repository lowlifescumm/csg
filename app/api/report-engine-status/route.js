import { NextResponse } from 'next/server';
import { pool } from '@/lib/db.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/report-engine-status
 * Health check endpoint to report current report engine configuration
 * 
 * Returns:
 * {
 *   engine: string - Current engine (puppeteer or template)
 *   templateCount: number - Number of templates available
 *   defaultEngine: string - The default engine from env
 * }
 */
export async function GET(request) {
  try {
    // Get engine from environment variable (default to 'puppeteer')
    const defaultEngine = process.env.REPORT_ENGINE || 'puppeteer';
    
    // Get query parameter override (if provided)
    const { searchParams } = new URL(request.url);
    const engineOverride = searchParams.get('engine');
    
    // Current engine (override takes precedence over env, but this endpoint shows the env default)
    const currentEngine = defaultEngine;
    
    // Count templates in database
    let templateCount = 0;
    try {
      const client = await pool.connect();
      try {
        // Try new report_templates table first
        const result = await client.query(
          'SELECT COUNT(*) as count FROM report_templates'
        );
        templateCount = parseInt(result.rows[0]?.count || '0', 10);
        
        // If no results, try legacy pdf_templates table
        if (templateCount === 0) {
          const legacyResult = await client.query(
            'SELECT COUNT(*) as count FROM pdf_templates WHERE is_active = true'
          );
          templateCount = parseInt(legacyResult.rows[0]?.count || '0', 10);
        }
      } finally {
        client.release();
      }
    } catch (dbError) {
      // Database might not be accessible or tables might not exist
      console.warn('[Report Engine Status] Could not count templates:', dbError.message);
      // Continue with templateCount = 0
    }
    
    return NextResponse.json({
      engine: currentEngine,
      defaultEngine,
      templateCount,
      engineOverride: engineOverride || null,
      message: engineOverride 
        ? `Engine override provided: ${engineOverride} (default: ${defaultEngine})`
        : `Using default engine: ${defaultEngine}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Report Engine Status] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get engine status',
        details: error.message,
        engine: process.env.REPORT_ENGINE || 'puppeteer',
      },
      { status: 500 }
    );
  }
}








