/**
 * Per-Minute Billing Cron Job
 * 
 * This endpoint should be called every minute by an external cron service
 * (e.g., Render Cron Jobs)
 * 
 * Security: Protect with CRON_SECRET token
 */

import { NextResponse } from 'next/server';
import { processActiveSessions } from '@/lib/per-minute-billing';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/cron/per-minute-billing
 * Run the per-minute billing service
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
      console.error('[Cron] CRON_SECRET not configured');
      return NextResponse.json({ 
        error: 'Service not configured' 
      }, { status: 500 });
    }

    // Trim whitespace/newlines from secret (Render environment variable quirk)
    const trimmedSecret = (cronSecret || '').trim().replace(/\r?\n/g, '');
    const trimmedHeader = (authHeader || '').trim();
    const expectedAuth = `Bearer ${trimmedSecret}`;
    
    if (!authHeader || trimmedHeader !== expectedAuth) {
      console.warn('[Cron] Unauthorized per-minute billing cron job attempt');
      return NextResponse.json({ 
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Run billing
    console.log('[Cron] Starting per-minute billing job...');
    const startTime = Date.now();
    const result = await processActiveSessions();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Log summary
    console.log('[Cron] === Per-Minute Billing Summary ===');
    console.log(`[Cron] Processed: ${result.processed}`);
    console.log(`[Cron] Billed: ${result.billed}`);
    console.log(`[Cron] Failed: ${result.failed}`);
    console.log(`[Cron] Total Debited: $${result.total_amount_debited.toFixed(2)}`);
    console.log(`[Cron] Duration: ${duration}s`);
    
    if (result.errors.length > 0) {
      console.warn(`[Cron] Errors: ${result.errors.length}`);
      result.errors.forEach(err => {
        console.warn(`[Cron]   Session ${err.session_id}: ${err.error}`);
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processed: result.processed,
      billed: result.billed,
      failed: result.failed,
      total_amount_debited: parseFloat(result.total_amount_debited.toFixed(2)),
      errors: result.errors,
      duration: `${duration}s`
    });

  } catch (error) {
    console.error('[Cron] Per-minute billing job failed:', error);
    return NextResponse.json({
      error: 'Job failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/cron/per-minute-billing
 * Alternative method for cron services that use POST
 */
export async function POST(req) {
  return GET(req);
}

