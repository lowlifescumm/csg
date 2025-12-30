/**
 * Warm-Up Endpoint
 * 
 * Lightweight endpoint to keep the service warm and prevent cold starts.
 * Called periodically by cron jobs to maintain service responsiveness.
 * 
 * This endpoint:
 * - Performs a lightweight database connection check
 * - Returns timing information for monitoring
 * - Should respond quickly (< 500ms) to avoid cron timeouts
 */

import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/warmup
 * Warm-up endpoint to keep service responsive
 * 
 * Optional Headers:
 * - Authorization: Bearer <CRON_SECRET> (for cron job calls)
 * 
 * Returns:
 * {
 *   status: 'warmed',
 *   timestamp: string,
 *   duration_ms: number,
 *   database: 'connected'
 * }
 */
export async function GET(request) {
  const startTime = Date.now();
  
  try {
    // Optional: Verify authorization if CRON_SECRET is provided
    // This allows the endpoint to be called by cron jobs securely
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // If CRON_SECRET is configured and authorization header is present, verify it
    if (cronSecret && authHeader) {
      const trimmedSecret = (cronSecret || '').trim().replace(/\r?\n/g, '');
      const trimmedHeader = (authHeader || '').trim();
      const expectedAuth = `Bearer ${trimmedSecret}`;
      
      if (trimmedHeader !== expectedAuth) {
        return NextResponse.json({
          status: 'error',
          timestamp: new Date().toISOString(),
          error: 'Unauthorized'
        }, { status: 401 });
      }
    }
    
    // 1. Database connection check (critical for all routes)
    // This ensures the database connection pool is warm
    await pool.query('SELECT 1');
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'warmed',
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('[Warmup] Error during warm-up:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      error: error.message,
      database: 'disconnected'
    }, { status: 503 });
  }
}

