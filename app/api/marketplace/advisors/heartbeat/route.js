/**
 * POST /api/marketplace/advisors/heartbeat
 * Update heartbeat timestamp for online advisors
 * Also checks for and resets stale online statuses
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth-config';
import { pool } from '@/lib/db';
import { 
  successResponse, 
  unauthorizedResponse, 
  forbiddenResponse,
  errorResponse 
} from '@/lib/api-response';

export const runtime = 'nodejs';

// Heartbeat timeout: 60 seconds (2 missed heartbeats if heartbeat interval is 30s)
const HEARTBEAT_TIMEOUT_SECONDS = 60;

/**
 * POST /api/marketplace/advisors/heartbeat
 * Update heartbeat timestamp (only if advisor is online)
 * Also resets stale online statuses for all advisors
 */
export async function POST(request) {
  try {
    // Authenticate user
    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);

    if (!authResult) {
      return unauthorizedResponse('Authentication required');
    }

    const userId = typeof authResult.userId === 'string' 
      ? parseInt(authResult.userId, 10) 
      : authResult.userId;

    if (!userId || isNaN(userId)) {
      return unauthorizedResponse('Invalid user ID');
    }

    // Check if user has advisor profile and is approved
    const profileCheck = await pool.query(
      `SELECT id, is_advisor, is_online FROM advisor_profile WHERE user_id = $1`,
      [userId]
    );

    if (profileCheck.rows.length === 0) {
      return forbiddenResponse('Advisor profile not found');
    }

    const profile = profileCheck.rows[0];
    if (!profile.is_advisor) {
      return forbiddenResponse('Advisor profile not approved');
    }

    // First, check for and reset stale online statuses (for all advisors)
    // This ensures that advisors who lost connection are marked offline
    await pool.query(
      `UPDATE advisor_profile 
       SET is_online = false, last_heartbeat_at = NULL, updated_at = NOW()
       WHERE is_online = true 
       AND last_heartbeat_at < NOW() - INTERVAL '${HEARTBEAT_TIMEOUT_SECONDS} seconds'`
    );

    // Only update heartbeat if advisor is currently online
    // If advisor is offline, ignore the heartbeat request
    if (profile.is_online) {
      const result = await pool.query(
        `UPDATE advisor_profile 
         SET last_heartbeat_at = NOW(), updated_at = NOW()
         WHERE user_id = $1 AND is_online = true
         RETURNING last_heartbeat_at`,
        [userId]
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return successResponse({
          last_heartbeat_at: row.last_heartbeat_at ? new Date(row.last_heartbeat_at).toISOString() : null
        });
      }
    }

    // If advisor is offline, return success but don't update (heartbeat ignored)
    return successResponse({
      last_heartbeat_at: null,
      message: 'Heartbeat ignored - advisor is offline'
    });
  } catch (error) {
    console.error('[Advisor Heartbeat] Error:', error);
    return errorResponse(
      'Failed to update heartbeat',
      500,
      error.message
    );
  }
}

