const logger = require('../../../lib/logger');
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/db';
import { addCreditsDirectly, refundCredits, getCreditBalance } from '@/lib/credit-engine.js';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { rows: userRows } = await pool.query(
      "SELECT role FROM users WHERE id=$1",
      [decoded.userId]
    );
    
    if (!userRows[0] || userRows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, amount, reason } = await request.json();

    if (!userId || amount === undefined) {
      return NextResponse.json({ error: 'User ID and amount are required' }, { status: 400 });
    }

    // Validate amount is a number
    const creditsToAdd = parseInt(amount, 10);
    if (isNaN(creditsToAdd)) {
      return NextResponse.json({ error: 'Amount must be a valid number' }, { status: 400 });
    }

    // Get current user info for logging
    const { rows: targetUserRows } = await pool.query(
      "SELECT email, first_name, last_name FROM users WHERE id=$1",
      [userId]
    );

    if (targetUserRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = targetUserRows[0];

    // Use new credit engine for credit adjustments
    if (creditsToAdd === 0) {
      // No change requested
      const balance = await getCreditBalance(userId);
      return NextResponse.json({ 
        success: true,
        message: 'No change requested',
        creditsChange: 0,
        currentBalance: balance.balance
      });
    }
    
    // Add or remove credits directly via admin adjustment
    // Positive amount = add, negative amount = remove
    const result = await addCreditsDirectly(userId, creditsToAdd, 'admin_adjustment', {
      admin_adjustment: true,
      adjusted_by: decoded.userId,
      reason: reason || 'Manual admin adjustment',
      timestamp: new Date().toISOString()
    });
    
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Failed to adjust credits',
        details: result.error 
      }, { status: 500 });
    }

    // Get final credit balance from new engine
    const balance = await getCreditBalance(userId);

    logger.info(`[Admin Credits] Admin ${decoded.userId} adjusted credits for user ${userId} (${targetUser.email}): ${creditsToAdd > 0 ? '+' : ''}${creditsToAdd}. Reason: ${reason || 'Manual adjustment'}`);

    return NextResponse.json({ 
      success: true,
      message: `Credits ${creditsToAdd > 0 ? 'added' : 'removed'} successfully`,
      creditsChange: creditsToAdd,
      newBalance: balance.balance,
      ledger_id: result.ledger_id
    });
  } catch (error) {
    logger.error('Update credits error:', error);
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
  }
}
