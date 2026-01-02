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
import { pool } from '@/lib/db';
import twilio from 'twilio';
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

    // Fetch session to get conversation_sid and verify authorization
    const sessionResult = await pool.query(
      `SELECT id, user_id, advisor_id, status, conversation_sid
       FROM advisor_sessions
       WHERE id = $1`,
      [sessionIdInt]
    );

    if (sessionResult.rows.length === 0) {
      return notFoundResponse('Session not found');
    }

    const session = sessionResult.rows[0];

    // Verify user is authorized (must be session participant)
    if (session.user_id !== userId && session.advisor_id !== userId) {
      return forbiddenResponse('Not authorized to disconnect this session');
    }

    // Close Twilio Conversation if it exists
    if (session.conversation_sid) {
      try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const conversationServiceSid = process.env.TWILIO_CONVERSATIONS_SERVICE_SID;

        if (accountSid && authToken && conversationServiceSid) {
          const twilioClient = twilio(accountSid, authToken);
          
          // Close/delete the Twilio Conversation
          await twilioClient.conversations.v1.services(conversationServiceSid)
            .conversations(session.conversation_sid)
            .remove();
          
          console.log(`[Disconnect Session] Closed Twilio Conversation: ${session.conversation_sid}`);
        } else {
          console.warn('[Disconnect Session] Twilio credentials not configured, skipping conversation closure');
        }
      } catch (twilioError) {
        // Log error but don't fail the disconnect if conversation closure fails
        // The conversation might already be closed or the session might not have one
        console.error('[Disconnect Session] Error closing Twilio Conversation:', twilioError);
        // Continue with billing finalization even if conversation closure fails
      }
    }

    // Finalize billing (includes authorization check, status validation, and billing)
    // Note: Authorization is already checked above, but finalizeSessionBilling also validates
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

