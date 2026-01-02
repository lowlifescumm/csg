/**
 * POST /api/marketplace/chat/token
 * 
 * Generate Twilio Access Token for Conversations Service
 * Validates NextAuth session and returns JWT token with identity and grants
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import twilio from 'twilio';

const AccessToken = twilio.jwt.AccessToken;
const ConversationGrant = AccessToken.ConversationGrant;

export const runtime = 'nodejs';

/**
 * POST /api/marketplace/chat/token
 * Generate Twilio Access Token for authenticated user
 */
export async function POST() {
  try {
    // Validate NextAuth session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get Twilio configuration from environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKeySid = process.env.TWILIO_API_KEY_SID;
    const apiSecret = process.env.TWILIO_API_SECRET;
    const conversationServiceSid = process.env.TWILIO_CONVERSATIONS_SERVICE_SID;

    // Validate required environment variables
    if (!accountSid || !apiKeySid || !apiSecret || !conversationServiceSid) {
      console.error('[Chat Token] Missing Twilio configuration:', {
        hasAccountSid: !!accountSid,
        hasApiKeySid: !!apiKeySid,
        hasApiSecret: !!apiSecret,
        hasConversationServiceSid: !!conversationServiceSid,
      });
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create Access Token
    const token = new AccessToken(accountSid, apiKeySid, apiSecret, {
      identity: session.user.id.toString(), // User ID as identity
    });

    // Grant access to Conversations Service
    const conversationGrant = new ConversationGrant({
      serviceSid: conversationServiceSid,
    });
    token.addGrant(conversationGrant);

    // Generate and return JWT token
    const jwtToken = token.toJwt();

    return NextResponse.json({
      token: jwtToken,
      identity: session.user.id.toString(),
    });
  } catch (error) {
    console.error('[Chat Token] Error generating token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token', details: error.message },
      { status: 500 }
    );
  }
}

