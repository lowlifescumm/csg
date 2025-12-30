/**
 * GET /api/marketplace/advisors/sessions/[sessionId]/webrtc/signals
 * Poll for incoming WebRTC signaling data (offers, answers, ICE candidates)
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
 * GET /api/marketplace/advisors/sessions/[sessionId]/webrtc/signals
 * Fetch pending signaling data for the authenticated user
 */
export async function GET(request, { params }) {
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

    // Fetch pending signals for this user
    const result = await pool.query(
      `SELECT 
        id,
        from_user_id,
        to_user_id,
        signal_type,
        signal_data,
        created_at
       FROM webrtc_signaling
       WHERE session_id = $1
         AND to_user_id = $2
         AND consumed = false
       ORDER BY created_at ASC`,
      [sessionIdInt, userId]
    );

    const signals = result.rows.map(row => ({
      id: row.id,
      from_user_id: row.from_user_id,
      to_user_id: row.to_user_id,
      signal_type: row.signal_type,
      signal_data: row.signal_data,
      created_at: row.created_at ? row.created_at.toISOString() : null
    }));

    // Mark signals as consumed
    if (signals.length > 0) {
      const signalIds = signals.map(s => s.id);
      await pool.query(
        `UPDATE webrtc_signaling 
         SET consumed = true 
         WHERE id = ANY($1::int[])`,
        [signalIds]
      );
    }

    return successResponse({
      signals: signals,
      count: signals.length
    });
  } catch (error) {
    console.error('[WebRTC Signals] Error:', error);
    return errorResponse(
      'Failed to fetch signals',
      500,
      error.message
    );
  }
}

