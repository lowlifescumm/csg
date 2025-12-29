/**
 * POST /api/marketplace/advisors/sessions/[sessionId]/webrtc/answer
 * Store WebRTC answer from one peer
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth-config';
import { pool } from '@/lib/db';
import { prisma } from '@/lib/prisma';
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
 * POST /api/marketplace/advisors/sessions/[sessionId]/webrtc/answer
 * Store WebRTC answer
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

    // Verify session exists and user is part of it
    const session = await prisma.advisor_sessions.findUnique({
      where: { id: sessionIdInt }
    });

    if (!session) {
      return notFoundResponse('Session not found');
    }

    // Verify user is authorized (user_id or advisor_id)
    if (session.user_id !== userId && session.advisor_id !== userId) {
      return forbiddenResponse('Not authorized to access this session');
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return badRequestResponse('Invalid request body');
    }

    const { answer } = body;

    if (!answer || typeof answer !== 'object') {
      return badRequestResponse('answer is required and must be an object');
    }

    if (!answer.type || answer.type !== 'answer') {
      return badRequestResponse('answer.type must be "answer"');
    }

    if (!answer.sdp || typeof answer.sdp !== 'string') {
      return badRequestResponse('answer.sdp is required and must be a string');
    }

    // Determine the other participant
    const toUserId = session.user_id === userId ? session.advisor_id : session.user_id;

    // Store answer in database
    const result = await pool.query(
      `INSERT INTO webrtc_signaling 
       (session_id, from_user_id, to_user_id, signal_type, signal_data, consumed, created_at)
       VALUES ($1, $2, $3, $4, $5, false, NOW())
       RETURNING id, created_at`,
      [
        sessionIdInt,
        userId,
        toUserId,
        'answer',
        JSON.stringify(answer)
      ]
    );

    return successResponse({
      id: result.rows[0].id,
      created_at: result.rows[0].created_at.toISOString()
    }, 201);
  } catch (error) {
    console.error('[WebRTC Answer] Error:', error);
    return errorResponse(
      'Failed to store answer',
      500,
      error.message
    );
  }
}

