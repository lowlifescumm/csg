import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/db';

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

    const { userId, amount } = await request.json();

    if (!userId || amount === undefined) {
      return NextResponse.json({ error: 'User ID and amount are required' }, { status: 400 });
    }

    // Update the user's credits
    await pool.query(
      'UPDATE credits SET amount = $1 WHERE user_id = $2',
      [amount, userId]
    );

    return NextResponse.json({ message: 'Credits updated successfully' });
  } catch (error) {
    console.error('Update credits error:', error);
    return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
  }
}
