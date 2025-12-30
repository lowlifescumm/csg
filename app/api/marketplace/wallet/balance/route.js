/**
 * GET /api/marketplace/wallet/balance
 * Get user's wallet balance (USD) from user_wallet_snapshot
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth-config';
import { pool } from '@/lib/db';
import { 
  successResponse, 
  unauthorizedResponse, 
  errorResponse 
} from '@/lib/api-response';

export const runtime = 'nodejs';

export async function GET(request) {
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

    // Query user_wallet_snapshot for cached balance
    const result = await pool.query(
      `SELECT balance, updated_at 
       FROM user_wallet_snapshot 
       WHERE user_id = $1`,
      [userId]
    );

    // If no snapshot exists, return 0 balance (snapshot should be initialized, but handle gracefully)
    if (result.rows.length === 0) {
      return successResponse({
        balance: 0,
        updated_at: new Date().toISOString()
      });
    }

    const row = result.rows[0];
    // Convert DECIMAL to number for JSON response
    const balance = parseFloat(row.balance) || 0;
    const updatedAt = row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString();

    return successResponse({
      balance: balance,
      updated_at: updatedAt
    });
  } catch (error) {
    console.error('[Wallet Balance] Error:', error);
    return errorResponse(
      'Failed to fetch wallet balance',
      500,
      error.message
    );
  }
}

