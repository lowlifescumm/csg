/**
 * GET /api/marketplace/advisors/sessions/[sessionId]/messages
 * POST /api/marketplace/advisors/sessions/[sessionId]/messages
 * 
 * Chat Messages API endpoints
 * - GET: Retrieve messages for a session
 * - POST: Save a new chat message
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth-config';
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

// Message validation constants
const MAX_MESSAGE_LENGTH = 5000;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * Helper function to verify user is authorized for session
 * Returns session if authorized, null if not found, throws if unauthorized
 */
async function verifySessionAccess(sessionId, userId) {
  const session = await prisma.advisor_sessions.findUnique({
    where: { id: sessionId }
  });

  if (!session) {
    return null;
  }

  // Verify user is either the client (user_id) or advisor (advisor_id)
  if (session.user_id !== userId && session.advisor_id !== userId) {
    throw new Error('UNAUTHORIZED');
  }

  return session;
}

/**
 * GET /api/marketplace/advisors/sessions/[sessionId]/messages
 * Retrieve messages for a session
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

    // Verify session access
    let session;
    try {
      session = await verifySessionAccess(sessionIdInt, userId);
    } catch (error) {
      if (error.message === 'UNAUTHORIZED') {
        return forbiddenResponse('Not authorized to access this session');
      }
      throw error;
    }

    if (!session) {
      return notFoundResponse('Session not found');
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
      MAX_LIMIT
    );
    const offset = parseInt(searchParams.get('offset') || '0', 10) || 0;
    const before = searchParams.get('before'); // Optional timestamp filter

    // Build where clause
    const where = {
      session_id: sessionIdInt,
      ...(before ? {
        created_at: {
          lt: new Date(before)
        }
      } : {})
    };

    // Query messages using Prisma
    const [messages, total] = await Promise.all([
      prisma.chat_messages.findMany({
        where,
        orderBy: {
          created_at: 'asc'
        },
        take: limit,
        skip: offset
      }),
      prisma.chat_messages.count({ where })
    ]);

    // Format messages for response
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      session_id: msg.session_id,
      sender_id: msg.sender_id,
      message_text: msg.message_text,
      created_at: msg.created_at ? msg.created_at.toISOString() : null
    }));

    return successResponse({
      messages: formattedMessages,
      total: total,
      limit: limit,
      offset: offset
    });
  } catch (error) {
    console.error('[Get Messages] Error:', error);
    return errorResponse(
      'Failed to retrieve messages',
      500,
      error.message
    );
  }
}

/**
 * POST /api/marketplace/advisors/sessions/[sessionId]/messages
 * Save a new chat message
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

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return badRequestResponse('Invalid request body');
    }

    const { message_text } = body;

    // Validate message_text
    if (!message_text || typeof message_text !== 'string') {
      return badRequestResponse('message_text is required and must be a string');
    }

    const trimmedMessage = message_text.trim();
    if (trimmedMessage.length === 0) {
      return badRequestResponse('message_text cannot be empty');
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return badRequestResponse(`message_text must be ${MAX_MESSAGE_LENGTH} characters or less`);
    }

    // Verify session exists and user is authorized
    let session;
    try {
      session = await verifySessionAccess(sessionIdInt, userId);
    } catch (error) {
      if (error.message === 'UNAUTHORIZED') {
        return forbiddenResponse('Not authorized to send messages in this session');
      }
      throw error;
    }

    if (!session) {
      return notFoundResponse('Session not found');
    }

    // Create message using Prisma
    const message = await prisma.chat_messages.create({
      data: {
        session_id: sessionIdInt,
        sender_id: userId,
        message_text: trimmedMessage
      }
    });

    // Format response
    return successResponse({
      id: message.id,
      session_id: message.session_id,
      sender_id: message.sender_id,
      message_text: message.message_text,
      created_at: message.created_at ? message.created_at.toISOString() : null
    }, 201);
  } catch (error) {
    console.error('[Save Message] Error:', error);
    return errorResponse(
      'Failed to save message',
      500,
      error.message
    );
  }
}

