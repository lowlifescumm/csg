import { createRequire } from "module";
const require = createRequire(import.meta.url);
const logger = require('./logger');
/**
 * Core Credit Engine
 * Implements atomic credit operations with ledger-based accounting
 */

import { pool } from './db.js';
import { FREE_CREDITS } from './pricing.js';

/**
 * Purchase credits - Add ledger entry for credit purchase
 * @param {number} userId - User ID
 * @param {number} packId - Number of credits purchased (previously called pack ID)
 * @param {object} meta - Additional metadata (purchase_id, stripe_payment_intent_id, etc.)
 * @returns {Promise<{success: boolean, ledger_id?: number, added_credits?: number, error?: string}>}
 */
export async function purchaseCredits(userId, packId, meta = {}) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Accept raw credit count (e.g. 15-credit packs, arbitrary report sizes).
    const credits = parseInt(packId, 10);
    if (!Number.isFinite(credits) || credits <= 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'INVALID_PACK' };
    }

    const source = `purchase_${credits}`;

    // Create ledger entry (purchased credits don't expire)
    const result = await client.query(
      `INSERT INTO credit_ledger (user_id, delta, source, meta, expires_at)
       VALUES ($1, $2, $3, $4, NULL)
       RETURNING id, delta, created_at`,
      [userId, credits, source, JSON.stringify(meta)]
    );
    
    const ledgerEntry = result.rows[0];
    
    // Update snapshot (trigger handles this, but we'll verify)
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
    
    await client.query('COMMIT');
    
    return {
      success: true,
      purchase_id: ledgerEntry.id,
      added_credits: ledgerEntry.delta,
      ledger_id: ledgerEntry.id,
      created_at: ledgerEntry.created_at
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('[Credit Engine] Purchase error:', error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

/**
 * Consume credits - Atomic operation with FOR UPDATE locking
 * @param {number} userId - User ID
 * @param {number} cost - Number of credits to consume
 * @param {string} readingId - Optional reading ID
 * @param {object} meta - Additional metadata
 * @returns {Promise<{success: boolean, new_balance?: number, error?: string, error_code?: string}>}
 */
export async function consumeCredits(userId, cost, readingId = null, meta = {}) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Verify user exists
    const userCheck = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );
    
    if (!userCheck.rows || userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: 'User not found',
        error_code: 'USER_NOT_FOUND'
      };
    }
    
    // Ensure snapshot exists and lock it for update (prevents concurrent consumption)
    // Use INSERT ... ON CONFLICT to create if doesn't exist, then lock it
    await client.query(
      `INSERT INTO user_credit_snapshot (user_id, balance, updated_at)
       VALUES ($1, 0, NOW())
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );
    
    // Now lock the row (it should exist now)
    const snapshotResult = await client.query(
      `SELECT balance FROM user_credit_snapshot 
       WHERE user_id = $1 
       FOR UPDATE`,
      [userId]
    );
    
    // If still no row found, something is wrong
    if (!snapshotResult.rows || snapshotResult.rows.length === 0) {
      await client.query('ROLLBACK');
      logger.error('[Credit Engine] Snapshot not found after creation for user:', userId);
      return {
        success: false,
        error: 'Failed to initialize credit snapshot',
        error_code: 'SNAPSHOT_NOT_FOUND'
      };
    }
    
    // Check if free credits can be used (from meta)
    const canUseFree = meta.can_use_free !== false; // Default to true if not specified
    
    // Get balance breakdown to check purchased vs free credits
    // Purchased credits include: purchase_*, admin_adjustment, migration_from_old_system
    const breakdownResult = await client.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN source LIKE 'free_%' AND (expires_at IS NULL OR expires_at > NOW()) THEN delta ELSE 0 END), 0) as free_credits,
         COALESCE(SUM(CASE WHEN source LIKE 'purchase_%' OR source = 'admin_adjustment' OR source = 'migration_from_old_system' THEN delta ELSE 0 END), 0) as purchased_credits,
         COALESCE(SUM(CASE WHEN source LIKE 'subscription_%' THEN delta ELSE 0 END), 0) as subscription_credits,
         COALESCE(SUM(CASE WHEN source = 'reading_consumption' THEN delta ELSE 0 END), 0) as consumed_credits
       FROM credit_ledger
       WHERE user_id = $1`,
      [userId]
    );
    
    const breakdown = breakdownResult.rows[0] || {};
    const freeCredits = parseInt(breakdown.free_credits || 0, 10);
    const purchasedCredits = parseInt(breakdown.purchased_credits || 0, 10);
    const subscriptionCredits = parseInt(breakdown.subscription_credits || 0, 10);
    const consumedCredits = Math.abs(parseInt(breakdown.consumed_credits || 0, 10));
    
    // Calculate available balance based on whether free credits can be used
    const availableBalance = canUseFree
      ? freeCredits + purchasedCredits + subscriptionCredits - consumedCredits
      : purchasedCredits + subscriptionCredits - consumedCredits;
    
    // Check if user has sufficient credits
    if (availableBalance < cost) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: 'Insufficient credits',
        error_code: 'INSUFFICIENT_CREDITS',
        available_balance: availableBalance,
        required: cost,
        breakdown: {
          free: freeCredits,
          purchased: purchasedCredits,
          subscription: subscriptionCredits,
          can_use_free: canUseFree
        }
      };
    }
    
    // Create consumption ledger entry
    const consumptionMeta = {
      ...meta,
      reading_id: readingId,
      cost,
      consumed_at: new Date().toISOString()
    };
    
    const ledgerResult = await client.query(
      `INSERT INTO credit_ledger (user_id, delta, source, meta)
       VALUES ($1, $2, 'reading_consumption', $3)
       RETURNING id, created_at`,
      [userId, -cost, JSON.stringify(consumptionMeta)]
    );
    
    // Update snapshot
    const newBalanceResult = await client.query(
      `SELECT COALESCE(SUM(delta), 0) as new_balance
       FROM credit_ledger
       WHERE user_id = $1
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [userId]
    );
    
    const newBalance = parseInt(newBalanceResult.rows[0]?.new_balance || 0);
    
    await client.query(
      `INSERT INTO user_credit_snapshot (user_id, balance, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET balance = $2, updated_at = NOW()`,
      [userId, newBalance]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      new_balance: newBalance,
      consumed: cost,
      ledger_id: ledgerResult.rows[0].id
    };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {}); // Ignore rollback errors
    logger.error('[Credit Engine] Consumption error:', error);
    logger.error('[Credit Engine] Error details:', {
      userId,
      cost,
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return { 
      success: false, 
      error: error.message,
      error_code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  } finally {
    client.release();
  }
}

/**
 * Get user credit balance with breakdown
 * @param {number} userId - User ID
 * @returns {Promise<{balance: number, breakdown: {free: number, purchased: number}, ledger_summary: object}>}
 */
export async function getCreditBalance(userId) {
  try {
    // Get snapshot balance (fast path)
    const snapshotResult = await pool.query(
      'SELECT balance FROM user_credit_snapshot WHERE user_id = $1',
      [userId]
    );
    
    // Get detailed breakdown from ledger
    // Purchased credits include: purchase_*, admin_adjustment, migration_from_old_system
    const breakdownResult = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN source LIKE 'free_%' AND (expires_at IS NULL OR expires_at > NOW()) THEN delta ELSE 0 END), 0) as free_credits,
         COALESCE(SUM(CASE WHEN source LIKE 'purchase_%' OR source = 'admin_adjustment' OR source = 'migration_from_old_system' THEN delta ELSE 0 END), 0) as purchased_credits,
         COALESCE(SUM(CASE WHEN source LIKE 'subscription_%' THEN delta ELSE 0 END), 0) as subscription_credits,
         COALESCE(SUM(CASE WHEN source = 'reading_consumption' THEN delta ELSE 0 END), 0) as consumed_credits,
         COALESCE(SUM(CASE WHEN source = 'refund' THEN delta ELSE 0 END), 0) as refunded_credits
       FROM credit_ledger
       WHERE user_id = $1`,
      [userId]
    );
    
    const breakdown = breakdownResult.rows[0];
    const snapshotBalance = parseInt(snapshotResult.rows[0]?.balance || 0);
    
    // Recalculate from ledger to ensure accuracy
    const ledgerBalanceResult = await pool.query(
      `SELECT COALESCE(SUM(delta), 0) as balance
       FROM credit_ledger
       WHERE user_id = $1
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [userId]
    );
    
    const ledgerBalance = parseInt(ledgerBalanceResult.rows[0]?.balance || 0);
    
    // Get recent ledger entries for summary
    const recentEntriesResult = await pool.query(
      `SELECT source, SUM(delta) as total_delta, COUNT(*) as count
       FROM credit_ledger
       WHERE user_id = $1
       GROUP BY source
       ORDER BY MAX(created_at) DESC
       LIMIT 10`,
      [userId]
    );
    
    return {
      balance: ledgerBalance, // Use ledger balance as source of truth
      snapshot_balance: snapshotBalance,
      breakdown: {
        free: parseInt(breakdown?.free_credits || 0),
        purchased: parseInt(breakdown?.purchased_credits || 0),
        subscription: parseInt(breakdown?.subscription_credits || 0),
        consumed: Math.abs(parseInt(breakdown?.consumed_credits || 0)),
        refunded: parseInt(breakdown?.refunded_credits || 0)
      },
      ledger_summary: recentEntriesResult.rows.map(row => ({
        source: row.source,
        total_delta: parseInt(row.total_delta),
        count: parseInt(row.count)
      }))
    };
  } catch (error) {
    logger.error('[Credit Engine] Balance query error:', error);
    return {
      balance: 0,
      snapshot_balance: 0,
      breakdown: { free: 0, purchased: 0, subscription: 0, consumed: 0, refunded: 0 },
      ledger_summary: []
    };
  }
}

/**
 * Issue free daily credits to a user
 * @param {number} userId - User ID
 * @returns {Promise<{success: boolean, added_credits?: number, error?: string}>}
 */
export async function issueFreeDailyCredits(userId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if user already received credits today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayCreditsResult = await client.query(
      `SELECT id FROM credit_ledger
       WHERE user_id = $1
         AND source = 'free_daily'
         AND created_at >= $2`,
      [userId, todayStart]
    );
    
    if (todayCreditsResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'ALREADY_ISSUED_TODAY' };
    }
    
    // Calculate expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + FREE_CREDITS.EXPIRY_HOURS);
    
    // Create ledger entry
    const result = await client.query(
      `INSERT INTO credit_ledger (user_id, delta, source, meta, expires_at)
       VALUES ($1, $2, 'free_daily', $3, $4)
       RETURNING id, delta, created_at, expires_at`,
      [
        userId,
        FREE_CREDITS.DAILY_REFRESH,
        JSON.stringify({ issued_at: new Date().toISOString() }),
        expiresAt
      ]
    );
    
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
    
    await client.query('COMMIT');
    
    return {
      success: true,
      added_credits: result.rows[0].delta,
      ledger_id: result.rows[0].id,
      expires_at: result.rows[0].expires_at
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('[Credit Engine] Free credit issuance error:', error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

/**
 * Issue subscription monthly credits
 * @param {number} userId - User ID
 * @param {number} credits - Number of credits to issue
 * @param {string} subscriptionTier - Subscription tier (e.g., 'MYSTIC_LITE', 'MYSTIC_PREMIUM')
 * @param {object} meta - Additional metadata
 * @returns {Promise<{success: boolean, added_credits?: number, error?: string}>}
 */
export async function issueSubscriptionCredits(userId, credits, subscriptionTier, meta = {}) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create ledger entry (subscription credits may have rollover rules)
    const source = `subscription_${subscriptionTier.toLowerCase()}`;
    const subscriptionMeta = {
      ...meta,
      subscription_tier: subscriptionTier,
      issued_at: new Date().toISOString()
    };
    
    // For now, subscription credits don't expire (rollover handled separately)
    const result = await client.query(
      `INSERT INTO credit_ledger (user_id, delta, source, meta, expires_at)
       VALUES ($1, $2, $3, $4, NULL)
       RETURNING id, delta, created_at`,
      [userId, credits, source, JSON.stringify(subscriptionMeta)]
    );
    
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
    
    await client.query('COMMIT');
    
    return {
      success: true,
      added_credits: result.rows[0].delta,
      ledger_id: result.rows[0].id
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('[Credit Engine] Subscription credit issuance error:', error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

/**
 * Refund credits (rollback on failed transactions)
 * @param {number} userId - User ID
 * @param {number} amount - Amount to refund
 * @param {string} reason - Refund reason
 * @param {object} meta - Additional metadata (original_ledger_id, etc.)
 * @returns {Promise<{success: boolean, refunded_credits?: number, error?: string}>}
 */
export async function refundCredits(userId, amount, reason, meta = {}) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const refundMeta = {
      ...meta,
      reason,
      refunded_at: new Date().toISOString()
    };
    
    // Create refund ledger entry (purchased credits don't expire)
    const result = await client.query(
      `INSERT INTO credit_ledger (user_id, delta, source, meta, expires_at)
       VALUES ($1, $2, 'refund', $3, NULL)
       RETURNING id, delta, created_at`,
      [userId, amount, JSON.stringify(refundMeta)]
    );
    
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
    
    await client.query('COMMIT');
    
    return {
      success: true,
      refunded_credits: result.rows[0].delta,
      ledger_id: result.rows[0].id
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('[Credit Engine] Refund error:', error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

/**
 * Add credits directly (for admin adjustments, bonuses, etc.)
 * @param {number} userId - User ID
 * @param {number} amount - Number of credits to add
 * @param {string} source - Source identifier (e.g., 'admin_adjustment', 'bonus', 'promotion')
 * @param {object} meta - Additional metadata
 * @returns {Promise<{success: boolean, added_credits?: number, ledger_id?: number, error?: string}>}
 */
export async function addCreditsDirectly(userId, amount, source = 'admin_adjustment', meta = {}) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    if (amount === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Amount cannot be zero' };
    }
    
    // Create ledger entry (admin adjustments don't expire)
    // Amount can be positive (add) or negative (remove)
    const result = await client.query(
      `INSERT INTO credit_ledger (user_id, delta, source, meta, expires_at)
       VALUES ($1, $2, $3, $4, NULL)
       RETURNING id, delta, created_at`,
      [userId, amount, source, JSON.stringify(meta)]
    );
    
    const ledgerEntry = result.rows[0];
    
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
    
    await client.query('COMMIT');
    
    return {
      success: true,
      added_credits: ledgerEntry.delta,
      ledger_id: ledgerEntry.id,
      created_at: ledgerEntry.created_at
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('[Credit Engine] Add credits error:', error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

/**
 * Clean up expired free credits (maintenance function)
 * @returns {Promise<{cleaned: number}>}
 */
export async function cleanupExpiredCredits() {
  try {
    // This is informational - expired credits are already excluded from balance calculations
    // But we can log how many have expired
    const expiredResult = await pool.query(
      `SELECT COUNT(*) as count, SUM(delta) as total_expired
       FROM credit_ledger
       WHERE expires_at IS NOT NULL
         AND expires_at <= NOW()
         AND source LIKE 'free_%'`
    );
    
    return {
      cleaned: parseInt(expiredResult.rows[0]?.count || 0),
      total_expired: parseInt(expiredResult.rows[0]?.total_expired || 0)
    };
  } catch (error) {
    logger.error('[Credit Engine] Cleanup error:', error);
    return { cleaned: 0 };
  }
}

