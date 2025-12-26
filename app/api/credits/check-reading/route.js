/**
 * GET /api/credits/check-reading
 * Check if user has sufficient credits for a reading type before starting
 * 
 * Query params:
 * - readingType: Reading type key (e.g., 'TAROT_BASIC', 'TAROT_PREMIUM', 'TAROT_CUSTOM')
 * - cardCount: Optional card count for custom spreads (1-10)
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { canAccessReading } from '@/lib/access-control.js';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    // Authenticate user
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use authenticated user's ID
    const userId = decoded.userId;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const readingType = searchParams.get('readingType');
    const cardCountParam = searchParams.get('cardCount');
    const cardCount = cardCountParam ? parseInt(cardCountParam, 10) : null;
    
    if (!readingType) {
      return NextResponse.json({ error: 'readingType parameter is required' }, { status: 400 });
    }
    
    // Validate cardCount if provided
    if (cardCount !== null && (cardCount < 1 || cardCount > 10)) {
      return NextResponse.json({ error: 'cardCount must be between 1 and 10' }, { status: 400 });
    }
    
    // Check if user can access this reading type
    const accessCheck = await canAccessReading(userId, readingType, cardCount);
    
    if (!accessCheck.allowed) {
      return NextResponse.json({
        allowed: false,
        reason: accessCheck.reason,
        cost: accessCheck.cost,
        required: accessCheck.required,
        available_balance: accessCheck.available_balance
      }, { status: 402 });
    }
    
    return NextResponse.json({
      allowed: true,
      reason: accessCheck.reason,
      cost: accessCheck.cost
    });
  } catch (error) {
    console.error('[Credits Check Reading] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

