/**
 * GET /api/credits/balance
 * Get user's credit balance with detailed breakdown
 * 
 * Query params: user_id (optional, uses authenticated user if not provided)
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getCreditBalance } from '@/lib/credit-engine.js';

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
    
    // Get balance with breakdown
    const balance = await getCreditBalance(userId);
    
    return NextResponse.json({
      success: true,
      balance: balance.balance,
      snapshot_balance: balance.snapshot_balance,
      breakdown: balance.breakdown,
      ledger_summary: balance.ledger_summary
    });
  } catch (error) {
    console.error('[Credits Balance] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

