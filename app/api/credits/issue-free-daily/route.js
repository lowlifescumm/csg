/**
 * POST /api/credits/issue-free-daily
 * Daily cron job to issue free credits to users
 * 
 * Headers:
 * - Authorization: Bearer <CRON_SECRET>
 * 
 * Body (optional): {
 *   user_id: number (if provided, issues to single user; otherwise processes all users)
 * }
 */

import { NextResponse } from 'next/server';
import { pool } from '@/lib/db.js';
import { issueFreeDailyCredits } from '@/lib/credit-engine.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      logger.error('[Free Credits Cron] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Service not configured' },
        { status: 500 }
      );
    }
    
    // Trim secrets to handle Render environment variable issues
    const trimmedSecret = (cronSecret || '').trim().replace(/\r?\n/g, '');
    const trimmedHeader = (authHeader || '').trim();
    const expectedAuth = `Bearer ${trimmedSecret}`;
    
    if (!authHeader || trimmedHeader !== expectedAuth) {
      logger.warn('[Free Credits Cron] Unauthorized attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      // Body is optional
    }
    
    const { user_id } = body;
    
    // If user_id provided, issue to single user
    if (user_id) {
      const result = await issueFreeDailyCredits(user_id);
      
      if (!result.success) {
        if (result.error === 'ALREADY_ISSUED_TODAY') {
          return NextResponse.json({
            success: true,
            message: 'Credits already issued today',
            user_id,
            skipped: true
          });
        }
        
        return NextResponse.json(
          { error: result.error || 'Failed to issue credits' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        user_id,
        added_credits: result.added_credits,
        expires_at: result.expires_at
      });
    }
    
    // Otherwise, process all users in batches
    logger.info('[Free Credits Cron] Starting batch processing...');
    
    let processed = 0;
    let skipped = 0;
    let errors = 0;
    const batchSize = 50;
    let offset = 0;
    
    while (true) {
      // Get batch of users
      const usersResult = await pool.query(
        `SELECT id FROM users 
         ORDER BY id 
         LIMIT $1 OFFSET $2`,
        [batchSize, offset]
      );
      
      if (usersResult.rows.length === 0) {
        break;
      }
      
      // Process each user
      for (const user of usersResult.rows) {
        const result = await issueFreeDailyCredits(user.id);
        
        if (result.success) {
          processed++;
        } else if (result.error === 'ALREADY_ISSUED_TODAY') {
          skipped++;
        } else {
          errors++;
          logger.error(`[Free Credits Cron] Error for user ${user.id}:`, result.error);
        }
      }
      
      offset += batchSize;
      
      // Small delay between batches to avoid overwhelming the database
      if (usersResult.rows.length === batchSize) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    logger.info(`[Free Credits Cron] Completed: ${processed} issued, ${skipped} skipped, ${errors} errors`);
    
    return NextResponse.json({
      success: true,
      processed,
      skipped,
      errors,
      message: `Issued free credits to ${processed} users, skipped ${skipped} (already issued), ${errors} errors`
    });
  } catch (error) {
    logger.error('[Free Credits Cron] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Also support GET for easier testing
export async function GET(request) {
  return POST(request);
}

