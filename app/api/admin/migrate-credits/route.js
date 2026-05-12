const logger = require('../../../../lib/logger');
/**
 * POST /api/admin/migrate-credits
 * One-time endpoint to migrate old credits to new credit ledger system
 * 
 * Headers:
 * - Authorization: Bearer <CRON_SECRET>
 */

import { NextResponse } from 'next/server';
import { pool } from '@/lib/db.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      return NextResponse.json(
        { error: 'Service not configured' },
        { status: 500 }
      );
    }
    
    const trimmedSecret = (cronSecret || '').trim().replace(/\r?\n/g, '');
    const trimmedHeader = (authHeader || '').trim();
    const expectedAuth = `Bearer ${trimmedSecret}`;
    
    if (!authHeader || trimmedHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    logger.info('[Credit Migration] Starting migration from old credits table...');
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get all users with credits from old table
      const oldCreditsResult = await client.query(
        `SELECT user_id, credits 
         FROM credits 
         WHERE credits > 0
         ORDER BY user_id`
      );
      
      logger.info(`[Credit Migration] Found ${oldCreditsResult.rows.length} users with credits`);
      
      if (oldCreditsResult.rows.length === 0) {
        await client.query('COMMIT');
        return NextResponse.json({
          success: true,
          message: 'No credits to migrate',
          migrated: 0,
          skipped: 0,
          errors: 0
        });
      }
      
      let migrated = 0;
      let skipped = 0;
      let errors = 0;
      let totalCreditsMigrated = 0;
      
      for (const row of oldCreditsResult.rows) {
        const userId = row.user_id;
        const oldCredits = parseInt(row.credits || 0);
        
        if (oldCredits <= 0) {
          skipped++;
          continue;
        }
        
        try {
          // Check if user already has ledger entries for purchased credits
          const existingLedgerResult = await client.query(
            `SELECT SUM(delta) as total_purchased
             FROM credit_ledger
             WHERE user_id = $1
               AND (source LIKE 'purchase_%' OR source = 'migration_from_old_system')`,
            [userId]
          );
          
          const existingPurchased = parseInt(existingLedgerResult.rows[0]?.total_purchased || 0);
          
          // Only migrate if the user doesn't already have equivalent credits in the new system
          const creditsToMigrate = oldCredits - existingPurchased;
          
          if (creditsToMigrate > 0) {
            // Create migration ledger entry
            await client.query(
              `INSERT INTO credit_ledger (user_id, delta, source, meta, expires_at)
               VALUES ($1, $2, 'migration_from_old_system', $3, NULL)
               RETURNING id`,
              [
                userId,
                creditsToMigrate,
                JSON.stringify({
                  old_credits: oldCredits,
                  migrated_at: new Date().toISOString(),
                  migration_note: 'Migrated from old credits table'
                })
              ]
            );
            
            totalCreditsMigrated += creditsToMigrate;
            migrated++;
          } else {
            skipped++;
          }
          
          // Update snapshot
          await client.query(
            `INSERT INTO user_credit_snapshot (user_id, balance, updated_at)
             VALUES ($1,
               COALESCE((SELECT SUM(delta) FROM credit_ledger WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())), 0),
               NOW())
             ON CONFLICT (user_id)
             DO UPDATE SET
               balance = COALESCE((SELECT SUM(delta) FROM credit_ledger WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())), 0),
               updated_at = NOW()`,
            [userId]
          );
          
        } catch (error) {
          logger.error(`[Credit Migration] Error for user ${userId}:`, error.message);
          errors++;
        }
      }
      
      await client.query('COMMIT');
      
      logger.info(`[Credit Migration] Completed: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
      
      return NextResponse.json({
        success: true,
        message: 'Migration completed',
        migrated,
        skipped,
        errors,
        total_credits_migrated: totalCreditsMigrated,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    logger.error('[Credit Migration] Error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error.message
      },
      { status: 500 }
    );
  }
}


