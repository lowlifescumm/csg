import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { pool } from '@/lib/db';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    
    // Try NextAuth session first (for Google OAuth admins)
    const auth = await getAuthenticatedUser(cookieStore, authOptions);
    
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { rows: userRows } = await pool.query(
      "SELECT role FROM users WHERE id=$1",
      [auth.userId]
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

    // Upsert credits - add to existing credits (not replace)
    // First check if record exists
    const { rows: existingCredits } = await pool.query(
      "SELECT credits FROM credits WHERE user_id = $1",
      [userId]
    );

    if (existingCredits.length > 0) {
      // Update existing record
      await pool.query(
        'UPDATE credits SET credits = GREATEST(0, credits + $1), updated_at = NOW() WHERE user_id = $2',
        [creditsToAdd, userId]
      );
    } else {
      // Insert new record
      await pool.query(
        'INSERT INTO credits (user_id, credits, created_at, updated_at) VALUES ($1, GREATEST(0, $2), NOW(), NOW())',
        [userId, creditsToAdd]
      );
    }

    // Get final credit balance
    const { rows: finalCredits } = await pool.query(
      "SELECT credits FROM credits WHERE user_id = $1",
      [userId]
    );

    console.log(`[Admin Credits] Admin ${auth.userId} adjusted credits for user ${userId} (${targetUser.email}): ${creditsToAdd > 0 ? '+' : ''}${creditsToAdd}. Reason: ${reason || 'Manual adjustment'}`);

    return NextResponse.json({ 
      success: true,
      message: `Credits ${creditsToAdd > 0 ? 'added' : 'adjusted'} successfully`,
      creditsChange: creditsToAdd,
      newBalance: finalCredits[0]?.credits || 0
    });
  } catch (error) {
    console.error('Update credits error:', error);
    return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
  }
}
