/**
 * Orphaned Session Cleanup Service
 * Handles cleanup of orphaned ACTIVE sessions after server restart/crash
 * Detects sessions that were ACTIVE before restart and finalizes their billing
 */

import { pool } from '@/lib/db';
import { finalizeSessionBilling } from '@/lib/session-billing';

/**
 * Cleanup all orphaned ACTIVE sessions
 * @returns {Promise<{orphaned_sessions_found: number, sessions_closed: number, sessions_failed: number, total_billing_finalized: number, errors: Array}>}
 */
export async function cleanupOrphanedSessions() {
  const client = await pool.connect();
  const results = {
    orphaned_sessions_found: 0,
    sessions_closed: 0,
    sessions_failed: 0,
    total_billing_finalized: 0,
    errors: []
  };

  try {
    console.log('[Orphaned Session Cleanup] Starting cleanup of orphaned sessions...');

    // Find all ACTIVE sessions (these are considered orphaned after server restart)
    const sessionsResult = await client.query(
      `SELECT 
        id,
        user_id,
        advisor_id,
        status,
        start_time,
        end_time,
        total_cost_usd,
        per_minute_rate
       FROM advisor_sessions
       WHERE status = 'ACTIVE'
       ORDER BY id ASC`,
      []
    );

    const sessions = sessionsResult.rows;
    results.orphaned_sessions_found = sessions.length;

    if (sessions.length === 0) {
      console.log('[Orphaned Session Cleanup] No orphaned sessions found');
      return results;
    }

    console.log(`[Orphaned Session Cleanup] Found ${sessions.length} orphaned session(s)`);

    // Process each orphaned session
    for (const session of sessions) {
      try {
        console.log(`[Orphaned Session Cleanup] Processing session ${session.id}...`);

        // Use finalizeSessionBilling to close the session and finalize billing
        // We use the user_id as the authorized user (both parties can disconnect)
        const billingResult = await finalizeSessionBilling(session.id, session.user_id);

        if (billingResult.success) {
          results.sessions_closed++;
          const totalCost = billingResult.data?.total_cost_usd || 0;
          results.total_billing_finalized += totalCost;
          console.log(`[Orphaned Session Cleanup] Successfully closed session ${session.id}, finalized billing: $${totalCost.toFixed(2)}`);
        } else {
          // If billing fails, we need to manually mark the session as FAILED
          results.sessions_failed++;
          results.errors.push({
            session_id: session.id,
            error: billingResult.error || 'Billing finalization failed'
          });

          // Manually mark session as FAILED since billing couldn't be finalized
          try {
            await client.query(
              `UPDATE advisor_sessions
               SET status = 'FAILED',
                   end_time = NOW(),
                   updated_at = NOW()
               WHERE id = $1`,
              [session.id]
            );
            console.log(`[Orphaned Session Cleanup] Marked session ${session.id} as FAILED due to billing error`);
          } catch (updateError) {
            console.error(`[Orphaned Session Cleanup] Failed to mark session ${session.id} as FAILED:`, updateError);
            results.errors.push({
              session_id: session.id,
              error: `Failed to mark as FAILED: ${updateError.message}`
            });
          }
        }
      } catch (error) {
        results.sessions_failed++;
        results.errors.push({
          session_id: session.id,
          error: error.message || 'Unknown error'
        });
        console.error(`[Orphaned Session Cleanup] Error processing session ${session.id}:`, error);

        // Try to mark session as FAILED even if there was an error
        try {
          await client.query(
            `UPDATE advisor_sessions
             SET status = 'FAILED',
                 end_time = NOW(),
                 updated_at = NOW()
             WHERE id = $1`,
            [session.id]
          );
        } catch (updateError) {
          console.error(`[Orphaned Session Cleanup] Failed to mark session ${session.id} as FAILED after error:`, updateError);
        }
      }
    }

    // Log summary
    console.log('[Orphaned Session Cleanup] === Cleanup Summary ===');
    console.log(`[Orphaned Session Cleanup] Orphaned sessions found: ${results.orphaned_sessions_found}`);
    console.log(`[Orphaned Session Cleanup] Sessions closed: ${results.sessions_closed}`);
    console.log(`[Orphaned Session Cleanup] Sessions failed: ${results.sessions_failed}`);
    console.log(`[Orphaned Session Cleanup] Total billing finalized: $${results.total_billing_finalized.toFixed(2)}`);
    
    if (results.errors.length > 0) {
      console.warn(`[Orphaned Session Cleanup] Errors: ${results.errors.length}`);
      results.errors.forEach(err => {
        console.warn(`[Orphaned Session Cleanup]   Session ${err.session_id}: ${err.error}`);
      });
    }

    return results;
  } catch (error) {
    console.error('[Orphaned Session Cleanup] Error during cleanup:', error);
    throw error;
  } finally {
    client.release();
  }
}

