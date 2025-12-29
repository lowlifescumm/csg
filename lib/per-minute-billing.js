/**
 * Per-Minute Billing Service
 * Handles incremental billing for active advisor sessions
 * Deducts USD from user wallet balances every minute while sessions are active
 */

import { pool } from '@/lib/db';

/**
 * Process all active sessions and bill for elapsed minutes
 * @returns {Promise<{processed: number, billed: number, failed: number, total_amount_debited: number, errors: Array}>}
 */
export async function processActiveSessions() {
  const client = await pool.connect();
  const results = {
    processed: 0,
    billed: 0,
    failed: 0,
    total_amount_debited: 0,
    errors: []
  };

  try {
    // Get all ACTIVE sessions
    const sessionsResult = await client.query(
      `SELECT 
        id,
        user_id,
        advisor_id,
        status,
        start_time,
        per_minute_rate,
        total_cost_usd,
        meta
       FROM advisor_sessions
       WHERE status = 'ACTIVE'
         AND start_time IS NOT NULL
         AND per_minute_rate IS NOT NULL
       ORDER BY id ASC`,
      []
    );

    const sessions = sessionsResult.rows;
    results.processed = sessions.length;

    if (sessions.length === 0) {
      return results;
    }

    // Process each session
    for (const session of sessions) {
      try {
        const billingResult = await billSessionMinute(client, session);
        
        if (billingResult.success) {
          results.billed++;
          results.total_amount_debited += billingResult.amount_debited || 0;
        } else {
          results.failed++;
          results.errors.push({
            session_id: session.id,
            error: billingResult.error
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          session_id: session.id,
          error: error.message || 'Unknown error'
        });
        console.error(`[Per-Minute Billing] Error processing session ${session.id}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error('[Per-Minute Billing] Error processing active sessions:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Bill a single session for elapsed minutes
 * @param {object} client - Database client (from pool.connect())
 * @param {object} session - Session row from database
 * @returns {Promise<{success: boolean, amount_debited?: number, minutes_billed?: number, error?: string}>}
 */
export async function billSessionMinute(client, session) {
  try {
    await client.query('BEGIN');

    // Lock session row to prevent race conditions
    const lockedSessionResult = await client.query(
      `SELECT 
        id,
        user_id,
        advisor_id,
        status,
        start_time,
        per_minute_rate,
        total_cost_usd,
        meta
       FROM advisor_sessions
       WHERE id = $1
       FOR UPDATE`,
      [session.id]
    );

    if (lockedSessionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Session not found' };
    }

    const lockedSession = lockedSessionResult.rows[0];

    // Verify session is still ACTIVE
    if (lockedSession.status !== 'ACTIVE') {
      await client.query('ROLLBACK');
      return { success: false, error: `Session is not ACTIVE (status: ${lockedSession.status})` };
    }

    // Parse meta JSONB
    const meta = lockedSession.meta || {};
    const lastBilledMinute = meta.last_billed_minute || 0;

    // Calculate elapsed minutes since start_time
    const startTime = new Date(lockedSession.start_time);
    const now = new Date();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    // Calculate minutes to bill
    const minutesToBill = elapsedMinutes - lastBilledMinute;

    if (minutesToBill <= 0) {
      // No minutes to bill yet
      await client.query('ROLLBACK');
      return { success: true, amount_debited: 0, minutes_billed: 0 };
    }

    // Get per-minute rate
    const perMinuteRate = parseFloat(lockedSession.per_minute_rate);
    if (!perMinuteRate || perMinuteRate <= 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Invalid per_minute_rate' };
    }

    // Calculate amount to debit
    const amountToDebit = parseFloat((minutesToBill * perMinuteRate).toFixed(2));

    // Check user balance
    const balanceResult = await client.query(
      `SELECT balance 
       FROM user_wallet_snapshot 
       WHERE user_id = $1`,
      [lockedSession.user_id]
    );

    const userBalance = balanceResult.rows.length > 0
      ? parseFloat(balanceResult.rows[0].balance) || 0
      : 0;

    if (userBalance < amountToDebit) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: `Insufficient funds. Balance: $${userBalance.toFixed(2)}, Required: $${amountToDebit.toFixed(2)}`
      };
    }

    // Create wallet ledger entry (SESSION_DEBIT)
    await client.query(
      `INSERT INTO wallet_ledger (user_id, amount, transaction_type, meta)
       VALUES ($1, $2, 'SESSION_DEBIT', $3)`,
      [
        lockedSession.user_id,
        -amountToDebit, // Negative for debit
        JSON.stringify({
          session_id: lockedSession.id,
          advisor_id: lockedSession.advisor_id,
          minutes_billed: minutesToBill,
          per_minute_rate: perMinuteRate,
          billed_at: now.toISOString(),
          billing_interval: 'per-minute',
          last_billed_minute: elapsedMinutes
        })
      ]
    );

    // Update session: accumulate total_cost_usd and update meta
    const currentTotalCost = parseFloat(lockedSession.total_cost_usd) || 0;
    const newTotalCost = parseFloat((currentTotalCost + amountToDebit).toFixed(2));

    const updatedMeta = {
      ...meta,
      last_billed_minute: elapsedMinutes
    };

    await client.query(
      `UPDATE advisor_sessions
       SET total_cost_usd = $1,
           meta = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [newTotalCost, JSON.stringify(updatedMeta), lockedSession.id]
    );

    await client.query('COMMIT');

    return {
      success: true,
      amount_debited: amountToDebit,
      minutes_billed: minutesToBill
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[Per-Minute Billing] Error billing session ${session.id}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to bill session'
    };
  }
}

