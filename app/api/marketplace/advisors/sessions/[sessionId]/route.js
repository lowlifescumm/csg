/**
 * GET /api/marketplace/advisors/sessions/[sessionId]
 * Get session details by ID
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
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
 * GET /api/marketplace/advisors/sessions/[sessionId]
 * Get session details
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

    // Fetch session using Prisma
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

    // Fetch advisor and user details separately using raw SQL
    const [advisorResult, userResult] = await Promise.all([
      pool.query(
        `SELECT u.id, u.first_name, u.last_name, u.avatar_url
         FROM users u
         WHERE u.id = $1`,
        [session.advisor_id]
      ),
      pool.query(
        `SELECT u.id, u.first_name, u.last_name, u.avatar_url
         FROM users u
         WHERE u.id = $1`,
        [session.user_id]
      )
    ]);

    const advisor = advisorResult.rows[0] || null;
    const user = userResult.rows[0] || null;

    // Format response
    const formattedSession = {
      id: session.id,
      user_id: session.user_id,
      advisor_id: session.advisor_id,
      status: session.status,
      start_time: session.start_time ? session.start_time.toISOString() : null,
      end_time: session.end_time ? session.end_time.toISOString() : null,
      total_cost_usd: session.total_cost_usd ? parseFloat(session.total_cost_usd) : null,
      per_minute_rate: session.per_minute_rate ? parseFloat(session.per_minute_rate) : null,
      conversation_sid: session.conversation_sid || null,
      created_at: session.created_at ? session.created_at.toISOString() : null,
      updated_at: session.updated_at ? session.updated_at.toISOString() : null,
      advisor: advisor ? {
        id: advisor.id,
        name: `${advisor.first_name || ''} ${advisor.last_name || ''}`.trim() || 'Advisor',
        first_name: advisor.first_name,
        last_name: advisor.last_name,
        avatar_url: advisor.avatar_url,
      } : null,
      user: user ? {
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User',
        first_name: user.first_name,
        last_name: user.last_name,
        avatar_url: user.avatar_url,
      } : null,
    };

    return successResponse(formattedSession);
  } catch (error) {
    console.error('[Get Session] Error:', error);
    return errorResponse(
      'Failed to fetch session',
      500,
      error.message
    );
  }
}

