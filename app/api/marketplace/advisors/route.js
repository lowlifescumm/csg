/**
 * GET /api/marketplace/advisors
 * List online advisors (public endpoint, no authentication required)
 * 
 * Returns list of advisors who are currently online and approved
 */

import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';

export const runtime = 'nodejs';

/**
 * GET /api/marketplace/advisors
 * List online advisors for marketplace
 */
export async function GET(request) {
  try {
    // Query online advisors (public endpoint - no authentication required)
    const result = await pool.query(
      `SELECT 
        ap.id,
        ap.user_id,
        u.first_name,
        u.last_name,
        u.avatar_url,
        ap.per_minute_rate,
        ap.specialties,
        ap.bio,
        ap.is_online,
        ap.last_heartbeat_at
       FROM advisor_profile ap
       JOIN users u ON ap.user_id = u.id
       WHERE ap.status = 'APPROVED'
         AND ap.is_online = true
       ORDER BY ap.last_heartbeat_at DESC NULLS LAST, u.first_name, u.last_name`,
      []
    );

    // Format advisors for response
    const advisors = result.rows.map(row => {
      // Build advisor name
      const firstName = row.first_name || '';
      const lastName = row.last_name || '';
      const name = (firstName && lastName) 
        ? `${firstName} ${lastName}`.trim()
        : firstName || lastName || 'Advisor';

      // Format rate
      const rate = row.per_minute_rate ? parseFloat(row.per_minute_rate) : null;
      const rateDisplay = rate ? `$${rate.toFixed(2)}/min` : 'Rate not set';

      return {
        id: row.id,
        user_id: row.user_id,
        name: name,
        first_name: row.first_name,
        last_name: row.last_name,
        avatar_url: row.avatar_url,
        per_minute_rate: rate,
        rate_display: rateDisplay,
        specialties: row.specialties || [],
        bio: row.bio,
        is_online: row.is_online || false,
        last_heartbeat_at: row.last_heartbeat_at ? new Date(row.last_heartbeat_at).toISOString() : null
      };
    });

    return successResponse({
      advisors: advisors,
      total: advisors.length
    });
  } catch (error) {
    console.error('[Marketplace Advisors] Error:', error);
    return errorResponse(
      'Failed to fetch advisors',
      500,
      error.message
    );
  }
}

