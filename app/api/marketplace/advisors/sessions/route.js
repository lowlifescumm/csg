/**
 * POST /api/marketplace/advisors/sessions
 * Validate wallet balance before session initialization
 * 
 * Checks if user has sufficient USD wallet balance (>= advisor's per_minute_rate)
 * to afford at least 1 minute of consultation
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
  notFoundResponse,
  forbiddenResponse,
  errorResponse
} from '@/lib/api-response';

export const runtime = 'nodejs';

/**
 * POST /api/marketplace/advisors/sessions
 * Validate session initialization (check wallet balance)
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
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return badRequestResponse('Invalid request body');
    }

    const { advisor_id } = body;

    // Validate advisor_id (accept both number and string)
    if (advisor_id === undefined || advisor_id === null) {
      return badRequestResponse('advisor_id is required');
    }

    const advisorId = typeof advisor_id === 'number' 
      ? Math.floor(advisor_id)
      : parseInt(advisor_id, 10);
    
    if (isNaN(advisorId) || advisorId <= 0) {
      return badRequestResponse('advisor_id must be a positive number');
    }

    // Prevent advisor from validating their own session
    if (advisorId === userId) {
      return badRequestResponse('Cannot start a session with yourself');
    }

    // Query advisor profile to verify advisor exists, is approved, and get rate
    const advisorResult = await pool.query(
      `SELECT 
        ap.user_id, 
        ap.per_minute_rate, 
        ap.status, 
        ap.is_online
       FROM advisor_profile ap
       WHERE ap.user_id = $1 AND ap.status = 'APPROVED'`,
      [advisorId]
    );

    if (advisorResult.rows.length === 0) {
      return notFoundResponse('Advisor not found or not approved');
    }

    const advisor = advisorResult.rows[0];

    // Verify advisor is online
    if (!advisor.is_online) {
      return forbiddenResponse('Advisor is currently offline');
    }

    // Verify advisor has a rate set
    const advisorRate = advisor.per_minute_rate ? parseFloat(advisor.per_minute_rate) : null;
    if (!advisorRate || advisorRate <= 0) {
      return errorResponse(
        'Advisor rate is not set or invalid',
        500,
        'Advisor profile has invalid per_minute_rate'
      );
    }

    // Query user wallet balance
    const walletResult = await pool.query(
      `SELECT balance 
       FROM user_wallet_snapshot 
       WHERE user_id = $1`,
      [userId]
    );

    // Default to 0 balance if snapshot doesn't exist
    const userBalance = walletResult.rows.length > 0
      ? parseFloat(walletResult.rows[0].balance) || 0
      : 0;

    // Compare balance >= advisor_rate (ensures at least 1 minute can be afforded)
    if (userBalance < advisorRate) {
      // Return 402 Payment Required for insufficient funds
      return NextResponse.json(
        {
          error: 'Insufficient funds',
          data: {
            valid: false,
            advisor_rate: advisorRate,
            user_balance: userBalance,
            required: advisorRate,
            shortfall: advisorRate - userBalance
          }
        },
        { status: 402 }
      );
    }

    // Calculate minutes they can afford (optional, for display)
    const canAffordMinutes = Math.floor(userBalance / advisorRate);

    // Validation passed - return success
    return successResponse({
      valid: true,
      advisor_rate: advisorRate,
      user_balance: userBalance,
      can_afford_minutes: canAffordMinutes
    });
  } catch (error) {
    console.error('[Session Validation] Error:', error);
    return errorResponse(
      'Failed to validate session',
      500,
      error.message
    );
  }
}

