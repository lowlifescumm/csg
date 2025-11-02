/**
 * Transit Monitor Cron Job
 * 
 * This endpoint should be called hourly by an external cron service
 * (e.g., Render Cron Jobs, Vercel Cron, or external monitoring service)
 * 
 * Security: Protect with a secret token
 */

import { NextResponse } from 'next/server';
import { monitorAllTransitSubscriptions, cleanupOldNotifications } from '@/lib/transit-monitor.js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/transit-monitor
 * Run the transit monitoring service
 * 
 * Headers:
 * - Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req) {
  try {
    // Verify authorization
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    console.log('[Cron Debug] Auth header received:', authHeader);
    console.log('[Cron Debug] CRON_SECRET exists:', !!cronSecret);

    if (!cronSecret) {
      console.error('[Cron] CRON_SECRET not configured');
      return NextResponse.json({ 
        error: 'Service not configured' 
      }, { status: 500 });
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Cron] Unauthorized cron job attempt');
      console.warn('[Cron Debug] Expected:', `Bearer ${cronSecret.substring(0, 10)}...`);
      console.warn('[Cron Debug] Received:', authHeader);
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Run monitoring
    console.log('[Cron] Starting transit monitoring job...');
    const result = await monitorAllTransitSubscriptions();

    // Cleanup old notifications (run once daily at midnight)
    const hour = new Date().getHours();
    if (hour === 0) {
      console.log('[Cron] Running cleanup job...');
      await cleanupOldNotifications();
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result
    });

  } catch (error) {
    console.error('[Cron] Transit monitor job failed:', error);
    return NextResponse.json({
      error: 'Job failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/cron/transit-monitor
 * Alternative method for cron services that use POST
 */
export async function POST(req) {
  return GET(req);
}




