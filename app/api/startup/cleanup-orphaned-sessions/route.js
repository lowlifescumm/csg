/**
 * Startup Cleanup Endpoint
 * 
 * This endpoint should be called after server restart to clean up orphaned ACTIVE sessions
 * Sessions that were ACTIVE before the restart are considered orphaned and need to be closed
 * 
 * Security: Protect with CRON_SECRET token
 */

import { NextResponse } from 'next/server';
import { cleanupOrphanedSessions } from '@/lib/orphaned-session-cleanup';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/startup/cleanup-orphaned-sessions
 * Clean up orphaned ACTIVE sessions after server restart
 * 
 * Headers:
 * - Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req) {
  try {
    // Verify authorization
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Startup Cleanup] CRON_SECRET not configured');
      return NextResponse.json({ 
        error: 'Service not configured' 
      }, { status: 500 });
    }

    // Trim whitespace/newlines from secret (Render environment variable quirk)
    const trimmedSecret = (cronSecret || '').trim().replace(/\r?\n/g, '');
    const trimmedHeader = (authHeader || '').trim();
    const expectedAuth = `Bearer ${trimmedSecret}`;
    
    if (!authHeader || trimmedHeader !== expectedAuth) {
      console.warn('[Startup Cleanup] Unauthorized cleanup attempt');
      return NextResponse.json({ 
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Run cleanup
    console.log('[Startup Cleanup] Starting orphaned session cleanup...');
    const startTime = Date.now();
    const result = await cleanupOrphanedSessions();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      orphaned_sessions_found: result.orphaned_sessions_found,
      sessions_closed: result.sessions_closed,
      sessions_failed: result.sessions_failed,
      total_billing_finalized: parseFloat(result.total_billing_finalized.toFixed(2)),
      errors: result.errors,
      duration: `${duration}s`
    });

  } catch (error) {
    console.error('[Startup Cleanup] Cleanup job failed:', error);
    return NextResponse.json({
      error: 'Cleanup failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/startup/cleanup-orphaned-sessions
 * Alternative method for services that use POST
 */
export async function POST(req) {
  return GET(req);
}

