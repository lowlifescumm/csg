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

    logger.info('[Cron Debug] Auth header received:', authHeader);
    logger.info('[Cron Debug] CRON_SECRET exists:', !!cronSecret);

    if (!cronSecret) {
      logger.error('[Cron] CRON_SECRET not configured');
      return NextResponse.json({ 
        error: 'Service not configured' 
      }, { status: 500 });
    }

    // CRITICAL: Render environment variables often have trailing newlines
    // We must aggressively trim to remove any whitespace/newlines
    const trimmedSecret = (cronSecret || '').trim().replace(/\r?\n/g, '');
    const trimmedHeader = (authHeader || '').trim();
    const expectedAuth = `Bearer ${trimmedSecret}`;
    
    logger.info('[Cron Debug] Secret length:', trimmedSecret.length);
    logger.info('[Cron Debug] Header length:', trimmedHeader?.length);
    logger.info('[Cron Debug] Expected full (masked):', `Bearer ${trimmedSecret.substring(0, 10)}...${trimmedSecret.substring(trimmedSecret.length - 4)}`);
    logger.info('[Cron Debug] Received full:', trimmedHeader);
    logger.info('[Cron Debug] Exact match:', trimmedHeader === expectedAuth);
    logger.info('[Cron Debug] Secret has whitespace:', cronSecret !== trimmedSecret);
    
    if (!authHeader || trimmedHeader !== expectedAuth) {
      logger.warn('[Cron] Unauthorized cron job attempt');
      logger.warn('[Cron Debug] Expected length:', expectedAuth.length);
      logger.warn('[Cron Debug] Received length:', trimmedHeader?.length);
      return NextResponse.json({ 
        error: 'Unauthorized',
        debug: {
          expectedLength: expectedAuth.length,
          receivedLength: trimmedHeader?.length,
          firstCharsMatch: trimmedHeader?.substring(0, 20) === expectedAuth.substring(0, 20),
          lastCharsMatch: trimmedHeader?.substring(trimmedHeader.length - 10) === expectedAuth.substring(expectedAuth.length - 10)
        }
      }, { status: 401 });
    }

    // Run monitoring
    logger.info('[Cron] Starting transit monitoring job...');
    const result = await monitorAllTransitSubscriptions();

    // Cleanup old notifications (run once daily at midnight)
    const hour = new Date().getHours();
    if (hour === 0) {
      logger.info('[Cron] Running cleanup job...');
      await cleanupOldNotifications();
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result
    });

  } catch (error) {
    logger.error('[Cron] Transit monitor job failed:', error);
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
  try {
    return await GET(req);
  } catch (error) {
    logger.error('[Cron] Transit monitor POST handler failed:', error);
    return NextResponse.json({
      error: 'Job failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}




