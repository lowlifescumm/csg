/**
 * GET /api/marketplace/wallet/transactions
 * Get user's wallet transaction history from wallet_ledger
 * 
 * Query params:
 * - limit: Number of transactions to return (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 * - type: Filter by transaction type (FUNDING, SESSION_DEBIT, EARNING_CREDIT) - optional
 * - date_from: Filter transactions from this date (ISO string) - optional
 * - date_to: Filter transactions to this date (ISO string) - optional
 * 
 * NOTE: This endpoint ONLY queries wallet_ledger. It NEVER queries credit_ledger.
 * Credit transactions are completely filtered out.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth-config';
import { pool } from '@/lib/db';
import { 
  successResponse, 
  unauthorizedResponse, 
  badRequestResponse,
  errorResponse 
} from '@/lib/api-response';

export const runtime = 'nodejs';

// Human-readable descriptions for transaction types
const TRANSACTION_DESCRIPTIONS = {
  FUNDING: 'Wallet Funding',
  SESSION_DEBIT: 'Advisor Session',
  EARNING_CREDIT: 'Session Earnings'
};

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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const typeFilter = searchParams.get('type'); // Optional: FUNDING, SESSION_DEBIT, EARNING_CREDIT
    const dateFrom = searchParams.get('date_from'); // Optional: ISO date string
    const dateTo = searchParams.get('date_to'); // Optional: ISO date string

    // Validate type filter if provided
    if (typeFilter && !['FUNDING', 'SESSION_DEBIT', 'EARNING_CREDIT'].includes(typeFilter)) {
      return badRequestResponse('Invalid transaction type filter');
    }

    // Build query with filters
    let query = `
      SELECT 
        id,
        amount,
        transaction_type,
        meta,
        created_at
      FROM wallet_ledger
      WHERE user_id = $1
    `;
    const queryParams = [userId];
    let paramIndex = 2;

    // Add type filter if provided
    if (typeFilter) {
      query += ` AND transaction_type = $${paramIndex}`;
      queryParams.push(typeFilter);
      paramIndex++;
    }

    // Add date range filters if provided
    if (dateFrom) {
      query += ` AND created_at >= $${paramIndex}`;
      queryParams.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND created_at <= $${paramIndex}`;
      queryParams.push(dateTo);
      paramIndex++;
    }

    // Order by created_at DESC (newest first) and add pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    // Execute query
    const result = await pool.query(query, queryParams);

    // Get total count for pagination (without limit/offset)
    let countQuery = `SELECT COUNT(*) as total FROM wallet_ledger WHERE user_id = $1`;
    const countParams = [userId];
    let countParamIndex = 2;

    if (typeFilter) {
      countQuery += ` AND transaction_type = $${countParamIndex}`;
      countParams.push(typeFilter);
      countParamIndex++;
    }

    if (dateFrom) {
      countQuery += ` AND created_at >= $${countParamIndex}`;
      countParams.push(dateFrom);
      countParamIndex++;
    }

    if (dateTo) {
      countQuery += ` AND created_at <= $${countParamIndex}`;
      countParams.push(dateTo);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // Format transactions for response
    const transactions = result.rows.map(row => {
      const amount = parseFloat(row.amount) || 0;
      const transactionType = row.transaction_type;
      
      // Parse meta JSONB (it's already parsed by pg driver, but handle both cases)
      let meta = {};
      if (row.meta) {
        if (typeof row.meta === 'string') {
          try {
            meta = JSON.parse(row.meta);
          } catch (e) {
            meta = {};
          }
        } else {
          meta = row.meta;
        }
      }

      return {
        id: row.id,
        amount: amount,
        transaction_type: transactionType,
        description: TRANSACTION_DESCRIPTIONS[transactionType] || transactionType,
        created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
        meta: meta
      };
    });

    return successResponse({
      transactions: transactions,
      total: total,
      limit: limit,
      offset: offset,
      has_more: (offset + limit) < total
    });
  } catch (error) {
    console.error('[Wallet Transactions] Error:', error);
    return errorResponse(
      'Failed to fetch wallet transactions',
      500,
      error.message
    );
  }
}

