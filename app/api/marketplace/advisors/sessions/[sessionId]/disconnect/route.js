/**
 * POST /api/marketplace/advisors/sessions/[sessionId]/disconnect
 * Disconnect and finalize billing for an advisor session
 * 
 * Triggers billing finalization when one party hangs up:
 * - Calculates session duration and cost
 * - Updates session status to COMPLETED
 * - Creates SESSION_DEBIT entry for user
 * - Creates EARNING_CREDIT entry for advisor
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth-config';
import { finalizeSessionBilling } from '@/lib/session-billing';
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
 * POST /api/marketplace/advisors/sessions/[sessionId]/disconnect
 * Disconnect session and finalize billing
 */
export async function POST(request, { params }) {
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

    // Get sessionId from params
    const { sessionId } = await params;
    const sessionIdInt = typeof sessionId === 'string'
      ? parseInt(sessionId, 10)
      : sessionId;

    if (!sessionIdInt || isNaN(sessionIdInt)) {
      return badRequestResponse('Invalid session ID');
    }

    // Finalize billing (includes authorization check, status validation, and billing)
    const result = await finalizeSessionBilling(sessionIdInt, userId);

    if (!result.success) {
      // Map error messages to appropriate HTTP status codes
      if (result.error === 'Session not found') {
        return notFoundResponse('Session');
      }
      if (result.error.includes('Not authorized')) {
        return forbiddenResponse(result.error);
      }
      if (result.error.includes('status')) {
        return badRequestResponse(result.error);
      }
      return errorResponse(result.error, 500);
    }

    // Return success with billing summary
    return successResponse(result.data);
  } catch (error) {
    console.error('[Disconnect Session] Error:', error);
    return errorResponse(
      'Failed to disconnect session',
      500,
      error.message
    );
  }
}

