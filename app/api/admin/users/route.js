import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/db';

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users.
 *     description: Retrieves a list of all users with their subscription status. Only accessible by administrators.
 *     responses:
 *       200:
 *         description: A list of users.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden, user is not an admin.
 *       500:
 *         description: Failed to fetch users.
 */
export async function GET() {
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

    const { rows: userRows } = await pool.query(
      "SELECT role FROM users WHERE id=$1",
      [decoded.userId]
    );
    
    if (!userRows[0] || userRows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { rows } = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.stripe_customer_id,
        u.stripe_subscription_id,
        u.created_at,
        s.status as subscription_status
      FROM users u
      LEFT JOIN subscriptions s ON u.stripe_subscription_id = s.stripe_subscription_id
      ORDER BY u.created_at DESC
    `);

    return NextResponse.json({ users: rows });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
