/**
 * PUT /api/marketplace/advisors/sessions/[sessionId]/accept
 * Accept a session request and create Twilio Conversation
 * 
 * Changes session status from REQUESTED to ACTIVE
 * Creates a Twilio Conversation and adds both User and Advisor as participants
 * Stores the Conversation SID in the database
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth-config';
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
 * PUT /api/marketplace/advisors/sessions/[sessionId]/accept
 * Accept session and create Twilio Conversation
 */
export async function PUT(request, { params }) {
  const client = await pool.connect();
  
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

    // Start transaction
    await client.query('BEGIN');

    // Fetch session and verify it exists
    const sessionResult = await client.query(
      `SELECT id, user_id, advisor_id, status, per_minute_rate, conversation_sid
       FROM advisor_sessions
       WHERE id = $1
       FOR UPDATE`,
      [sessionIdInt]
    );

    if (sessionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return notFoundResponse('Session not found');
    }

    const session = sessionResult.rows[0];

    // Verify user is the advisor for this session
    if (session.advisor_id !== userId) {
      await client.query('ROLLBACK');
      return forbiddenResponse('Only the advisor can accept this session');
    }

    // Verify session is in REQUESTED status
    if (session.status !== 'REQUESTED') {
      await client.query('ROLLBACK');
      return badRequestResponse(`Session is already ${session.status}. Cannot accept.`);
    }

    // Verify conversation_sid doesn't already exist
    if (session.conversation_sid) {
      await client.query('ROLLBACK');
      return badRequestResponse('Conversation already exists for this session');
    }

    // Get Twilio configuration
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKeySid = process.env.TWILIO_API_KEY_SID;
    const apiSecret = process.env.TWILIO_API_SECRET;
    const conversationServiceSid = process.env.TWILIO_CONVERSATIONS_SERVICE_SID;

    if (!accountSid || !apiKeySid || !apiSecret || !conversationServiceSid) {
      await client.query('ROLLBACK');
      console.error('[Accept Session] Missing Twilio configuration');
      return errorResponse(
        'Server configuration error',
        500,
        'Twilio Conversations Service not configured'
      );
    }

    // Initialize Twilio client
    const twilioClient = twilio(apiKeySid, apiSecret, { accountSid });

    // Create Twilio Conversation
    let conversation;
    try {
      conversation = await twilioClient.conversations.v1.services(conversationServiceSid)
        .conversations
        .create({
          friendlyName: `Session ${sessionIdInt} - User ${session.user_id} & Advisor ${session.advisor_id}`,
        });
    } catch (twilioError) {
      await client.query('ROLLBACK');
      console.error('[Accept Session] Twilio Conversation creation failed:', twilioError);
      return errorResponse(
        'Failed to create conversation',
        500,
        twilioError.message
      );
    }

    const conversationSid = conversation.sid;

    // Add User as participant (identity = user_id as string)
    try {
      await twilioClient.conversations.v1.services(conversationServiceSid)
        .conversations(conversationSid)
        .participants
        .create({
          identity: session.user_id.toString(),
        });
    } catch (userParticipantError) {
      // Try to clean up conversation if participant creation fails
      try {
        await twilioClient.conversations.v1.services(conversationServiceSid)
          .conversations(conversationSid)
          .remove();
      } catch (cleanupError) {
        console.error('[Accept Session] Failed to cleanup conversation:', cleanupError);
      }
      await client.query('ROLLBACK');
      console.error('[Accept Session] Failed to add user participant:', userParticipantError);
      return errorResponse(
        'Failed to add user to conversation',
        500,
        userParticipantError.message
      );
    }

    // Add Advisor as participant (identity = advisor_id as string)
    try {
      await twilioClient.conversations.v1.services(conversationServiceSid)
        .conversations(conversationSid)
        .participants
        .create({
          identity: session.advisor_id.toString(),
        });
    } catch (advisorParticipantError) {
      // Try to clean up conversation if participant creation fails
      try {
        await twilioClient.conversations.v1.services(conversationServiceSid)
          .conversations(conversationSid)
          .remove();
      } catch (cleanupError) {
        console.error('[Accept Session] Failed to cleanup conversation:', cleanupError);
      }
      await client.query('ROLLBACK');
      console.error('[Accept Session] Failed to add advisor participant:', advisorParticipantError);
      return errorResponse(
        'Failed to add advisor to conversation',
        500,
        advisorParticipantError.message
      );
    }

    // Update session: set status to ACTIVE, store conversation_sid, set start_time
    const now = new Date();
    await client.query(
      `UPDATE advisor_sessions
       SET status = 'ACTIVE',
           conversation_sid = $1,
           start_time = $2,
           updated_at = $2
       WHERE id = $3`,
      [conversationSid, now, sessionIdInt]
    );

    // Commit transaction
    await client.query('COMMIT');

    return successResponse({
      session_id: sessionIdInt,
      status: 'ACTIVE',
      conversation_sid: conversationSid,
      start_time: now.toISOString(),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Accept Session] Error:', error);
    return errorResponse(
      'Failed to accept session',
      500,
      error.message
    );
  } finally {
    client.release();
  }
}

