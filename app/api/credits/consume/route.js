/**
 * POST /api/credits/consume
 * Atomically consume credits for a reading/feature
 * 
 * Body: {
 *   user_id: number (optional, uses authenticated user if not provided),
 *   cost: number,
 *   reading_id: string (optional),
 *   meta: object (optional)
 * }
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { consumeCredits } from '@/lib/credit-engine.js';

export const runtime = 'nodejs';

export async function POST(request) {
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
    
    const body = await request.json();
    const { cost, reading_id, meta = {} } = body;
    
    // Use authenticated user's ID
    const userId = decoded.userId;
    
    // Validate cost
    if (!cost || typeof cost !== 'number' || cost <= 0) {
      return NextResponse.json(
        { error: 'Invalid cost. Must be a positive number.' },
        { status: 400 }
      );
    }
    
    // Consume credits atomically
    const result = await consumeCredits(userId, cost, reading_id, meta);
    
    if (!result.success) {
      if (result.error_code === 'INSUFFICIENT_CREDITS') {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            error_code: 'INSUFFICIENT_CREDITS',
            available_balance: result.available_balance,
            required: result.required
          },
          { status: 402 }
        );
      }
      
      return NextResponse.json(
        { error: result.error || 'Failed to consume credits' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      consumed: result.consumed,
      new_balance: result.new_balance,
      ledger_id: result.ledger_id
    });
  } catch (error) {
    console.error('[Credits Consume] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

