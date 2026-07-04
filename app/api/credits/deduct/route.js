import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth-config';
import { cookies } from 'next/headers';
import { consumeCreditsForReading } from '@/lib/access-control';

/**
 * POST /api/credits/deduct
 * 
 * Deduct credits for a reading. This is called by the frontend
 * after the paywall gate confirms the user has sufficient credits.
 * 
 * Body: { readingType: string, cost: number, readingId?: string }
 */
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const auth = await getAuthenticatedUser(cookieStore, authOptions);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { readingType, cost, readingId } = body;
    
    if (!readingType || typeof cost !== 'number' || cost < 1) {
      return NextResponse.json(
        { error: 'Invalid reading type or cost' },
        { status: 400 }
      );
    }

    const userId = parseInt(auth.userId, 10);
    
    // Use the access control function to consume credits
    const result = await consumeCreditsForReading(userId, readingType, readingId);
    
    if (!result.success) {
      // Map error messages to user-friendly responses
      if (result.message === 'insufficient_credits') {
        return NextResponse.json(
          { 
            error: 'Insufficient credits',
            required: result.required,
            available: result.available_balance
          },
          { status: 402 }
        );
      }
      
      return NextResponse.json(
        { error: result.message || 'Failed to deduct credits' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      cost: result.cost,
      newBalance: result.new_balance,
      message: result.message
    });
    
  } catch (error) {
    console.error('Error deducting credits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
