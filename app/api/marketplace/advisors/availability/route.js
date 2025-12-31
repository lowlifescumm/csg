/**
 * POST /api/marketplace/advisors/availability
 * Update advisor online/offline status
 * 
 * Body: { is_online: boolean }
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth-config';
import { pool } from '@/lib/db';
import { 
  successResponse, 
  unauthorizedResponse, 
  badRequestResponse,
  forbiddenResponse,
  errorResponse 
} from '@/lib/api-response';

export const runtime = 'nodejs';

/**
 * POST /api/marketplace/advisors/availability
 * Update advisor online/offline status
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

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { is_online } = body;

    // Validate input
    if (typeof is_online !== 'boolean') {
      return badRequestResponse('is_online must be a boolean value');
    }

    // Check if user has advisor profile and is approved
    const profileCheck = await pool.query(
      `SELECT id, status FROM advisor_profile WHERE user_id = $1`,
      [userId]
    );

    if (profileCheck.rows.length === 0) {
      return forbiddenResponse('Advisor profile not found. Please complete your advisor profile first.');
    }

    const profile = profileCheck.rows[0];
    if (profile.status !== 'APPROVED') {
      return forbiddenResponse('Your advisor profile is pending approval. You must be approved before you can go online.');
    }

    // Update online status
    // When going online: set is_online = true and last_heartbeat_at = NOW()
    // When going offline: set is_online = false and last_heartbeat_at = NULL
    const updateQuery = is_online
      ? `UPDATE advisor_profile 
         SET is_online = true, last_heartbeat_at = NOW(), updated_at = NOW()
         WHERE user_id = $1
         RETURNING is_online, last_heartbeat_at`
      : `UPDATE advisor_profile 
         SET is_online = false, last_heartbeat_at = NULL, updated_at = NOW()
         WHERE user_id = $1
         RETURNING is_online, last_heartbeat_at`;

    const result = await pool.query(updateQuery, [userId]);

    if (result.rows.length === 0) {
      return errorResponse('Failed to update availability status', 500);
    }

    const row = result.rows[0];

    return successResponse({
      is_online: row.is_online || false,
      last_heartbeat_at: row.last_heartbeat_at ? new Date(row.last_heartbeat_at).toISOString() : null
    });
  } catch (error) {
    console.error('[Advisor Availability] Error:', error);
    return errorResponse(
      'Failed to update availability status',
      500,
      error.message
    );
  }
}

