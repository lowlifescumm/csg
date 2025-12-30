/**
 * Session Billing Service
 * Handles billing finalization for advisor sessions
 * Calculates session cost, updates session status, and creates wallet ledger entries
 */

import { pool } from '@/lib/db';
import { prisma } from '@/lib/prisma';

/**
 * Finalize session billing when session ends
 * @param {number} sessionId - Session ID
 * @param {number} userId - User ID of the party initiating disconnect (for authorization)
 * @param {string} reason - Optional termination reason (e.g., 'insufficient_funds', 'user_disconnect', 'advisor_disconnect')
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function finalizeSessionBilling(sessionId, userId, reason = null) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lock session row to prevent race conditions
    const sessionResult = await client.query(
      `SELECT id, user_id, advisor_id, status, start_time, end_time, total_cost_usd, per_minute_rate
       FROM advisor_sessions
       WHERE id = $1
       FOR UPDATE`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Session not found' };
    }

    const session = sessionResult.rows[0];

    // Verify user is authorized (must be session participant)
    if (session.user_id !== userId && session.advisor_id !== userId) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Not authorized to disconnect this session' };
    }

    // Idempotency: If already completed, return success with existing data
    if (session.status === 'COMPLETED' || session.status === 'FAILED') {
      await client.query('ROLLBACK');
      return {
        success: true,
        data: {
          session_id: session.id,
          status: session.status,
          total_cost_usd: session.total_cost_usd ? parseFloat(session.total_cost_usd) : 0,
          end_time: session.end_time ? new Date(session.end_time).toISOString() : null,
          already_finalized: true
        }
      };
    }

    // Validate session is in ACTIVE status
    if (session.status !== 'ACTIVE') {
      await client.query('ROLLBACK');
      return { success: false, error: `Cannot disconnect session in ${session.status} status` };
    }

    // Validate start_time exists
    if (!session.start_time) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Session start_time is missing' };
    }

    // Calculate duration and cost
    const endTime = new Date();
    const startTime = new Date(session.start_time);
    const durationMs = endTime - startTime;
    const durationSeconds = Math.max(0, Math.floor(durationMs / 1000));
    const durationMinutes = durationSeconds / 60;

    // Minimum charge: 1 minute if duration < 1 minute
    const billableMinutes = Math.max(1, Math.ceil(durationMinutes));
    
    const perMinuteRate = parseFloat(session.per_minute_rate) || 0;
    const totalCostUsd = parseFloat((billableMinutes * perMinuteRate).toFixed(2));

    // Get existing meta to preserve it
    const metaResult = await client.query(
      `SELECT meta FROM advisor_sessions WHERE id = $1`,
      [sessionId]
    );
    const existingMeta = metaResult.rows[0]?.meta || {};
    
    // Add termination reason to meta if provided
    const updatedMeta = reason 
      ? { ...existingMeta, termination_reason: reason, terminated_at: endTime.toISOString() }
      : existingMeta;

    // Update session: set status, end_time, total_cost_usd, and meta
    await client.query(
      `UPDATE advisor_sessions
       SET status = 'COMPLETED',
           end_time = $1,
           total_cost_usd = $2,
           meta = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [endTime, totalCostUsd, JSON.stringify(updatedMeta), sessionId]
    );

    // Create wallet ledger entries
    // 1. User debit (SESSION_DEBIT) - negative amount
    await client.query(
      `INSERT INTO wallet_ledger (user_id, amount, transaction_type, meta)
       VALUES ($1, $2, 'SESSION_DEBIT', $3)`,
      [
        session.user_id,
        -totalCostUsd, // Negative for debit
        JSON.stringify({
          session_id: sessionId,
          advisor_id: session.advisor_id,
          duration_seconds: durationSeconds,
          duration_minutes: durationMinutes,
          billable_minutes: billableMinutes,
          per_minute_rate: perMinuteRate,
          finalized_at: endTime.toISOString()
        })
      ]
    );

    // 2. Advisor credit (EARNING_CREDIT) - positive amount
    await client.query(
      `INSERT INTO wallet_ledger (user_id, amount, transaction_type, meta)
       VALUES ($1, $2, 'EARNING_CREDIT', $3)`,
      [
        session.advisor_id,
        totalCostUsd, // Positive for credit
        JSON.stringify({
          session_id: sessionId,
          user_id: session.user_id,
          duration_seconds: durationSeconds,
          duration_minutes: durationMinutes,
          billable_minutes: billableMinutes,
          per_minute_rate: perMinuteRate,
          finalized_at: endTime.toISOString()
        })
      ]
    );

    await client.query('COMMIT');

    return {
      success: true,
      data: {
        session_id: sessionId,
        status: 'COMPLETED',
        end_time: endTime.toISOString(),
        total_cost_usd: totalCostUsd,
        duration_seconds: durationSeconds,
        duration_minutes: durationMinutes,
        billable_minutes: billableMinutes,
        per_minute_rate: perMinuteRate
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Session Billing] Error finalizing billing:', error);
    return { success: false, error: error.message || 'Failed to finalize session billing' };
  } finally {
    client.release();
  }
}

