/**
 * GET /api/marketplace/advisors/sessions/pending
 * Get pending session requests for the authenticated advisor
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

/**
 * GET /api/marketplace/advisors/sessions/pending
 * Get pending session requests for the authenticated advisor
 */
export async function GET(request) {
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

    // Verify user is an approved advisor
    const advisorCheck = await pool.query(
      `SELECT ap.is_advisor, ap.is_online
       FROM advisor_profile ap
       WHERE ap.user_id = $1`,
      [userId]
    );

    if (advisorCheck.rows.length === 0 || !advisorCheck.rows[0].is_advisor) {
      // Return empty array instead of error (advisor may not have profile yet)
      return successResponse({
        sessions: [],
        total: 0
      });
    }

    // Fetch pending session requests
    const result = await pool.query(
      `SELECT 
        s.id,
        s.user_id,
        s.status,
        s.per_minute_rate,
        s.created_at,
        u.first_name,
        u.last_name,
        u.avatar_url
       FROM advisor_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.advisor_id = $1
         AND s.status = 'REQUESTED'
       ORDER BY s.created_at DESC`,
      [userId]
    );

    const sessions = result.rows.map(row => {
      const firstName = row.first_name || '';
      const lastName = row.last_name || '';
      const name = (firstName && lastName) 
        ? `${firstName} ${lastName}`.trim()
        : firstName || lastName || 'User';

      return {
        id: row.id,
        user_id: row.user_id,
        status: row.status,
        per_minute_rate: row.per_minute_rate ? parseFloat(row.per_minute_rate) : null,
        created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
        user: {
          id: row.user_id,
          name: name,
          first_name: row.first_name,
          last_name: row.last_name,
          avatar_url: row.avatar_url
        }
      };
    });

    return successResponse({
      sessions: sessions,
      total: sessions.length
    });
  } catch (error) {
    console.error('[Pending Sessions] Error:', error);
    return errorResponse(
      'Failed to fetch pending sessions',
      500,
      error.message
    );
  }
}

