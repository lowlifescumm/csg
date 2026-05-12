import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth-config';
import { pool } from '@/lib/db';
import { addCreditsDirectly } from '@/lib/credit-engine';

/**
 * POST /api/user/reward-share
 * Reward user with 3 credits for their first share
 * 
 * Logic:
 * 1. Check if user has already been rewarded (has_rewarded_share = true)
 * 2. If not, add 3 credits and mark as rewarded
 * 3. Return success/error response
 */
export async function POST(request) {
  try {
    // Get authenticated user
    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);

    if (!authResult) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = authResult;

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if column exists, if not add it
      try {
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS has_rewarded_share BOOLEAN DEFAULT false
        `);
      } catch (colError) {
        // Column might already exist or other error - continue
        if (!colError.message.includes('already exists') && !colError.code === '42710') {
          logger.warn('[Share Reward] Column check warning:', colError.message);
        }
      }

      // Check if user has already been rewarded
      const userCheck = await client.query(
        'SELECT has_rewarded_share FROM users WHERE id = $1',
        [userId]
      );

      if (userCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const hasRewardedShare = userCheck.rows[0].has_rewarded_share ?? false;

      if (hasRewardedShare) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { 
            success: false, 
            message: 'Already rewarded',
            error: 'User has already claimed their first share reward'
          },
          { status: 400 }
        );
      }

      // Add 3 credits using credit engine
      const creditResult = await addCreditsDirectly(
        userId,
        3,
        'share_reward',
        {
          reward_type: 'first_share',
          rewarded_at: new Date().toISOString()
        }
      );

      if (!creditResult.success) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to add credits',
            details: creditResult.error
          },
          { status: 500 }
        );
      }

      // Mark user as rewarded
      await client.query(
        'UPDATE users SET has_rewarded_share = true WHERE id = $1',
        [userId]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Reward claimed!',
        credits_added: 3,
        new_balance: creditResult.added_credits
      });

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('[Share Reward] Transaction error:', error);
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    logger.error('[Share Reward] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process share reward',
        details: error.message
      },
      { status: 500 }
    );
  }
}

