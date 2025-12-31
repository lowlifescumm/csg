import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, getUserById } from '@/lib/auth';
import { pool } from '@/lib/db';

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

    const user = await getUserById(decoded.userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Query pending advisor applications
    const result = await pool.query(`
      SELECT 
        ap.id,
        ap.user_id,
        ap.bio,
        ap.specialties,
        ap.per_minute_rate,
        ap.created_at,
        ap.updated_at,
        u.email as user_email,
        u.first_name,
        u.last_name
      FROM advisor_profile ap
      JOIN users u ON ap.user_id = u.id
      WHERE ap.status = 'PENDING'
      ORDER BY ap.created_at DESC
    `);

    // Format applications for response
    const applications = result.rows.map(row => {
      const firstName = row.first_name || '';
      const lastName = row.last_name || '';
      const userName = (firstName && lastName) 
        ? `${firstName} ${lastName}`.trim()
        : firstName || lastName || null;

      return {
        id: row.id,
        user_id: row.user_id,
        user_email: row.user_email,
        user_name: userName,
        first_name: row.first_name,
        last_name: row.last_name,
        bio: row.bio,
        specialties: row.specialties || [],
        per_minute_rate: row.per_minute_rate ? parseFloat(row.per_minute_rate) : null,
        created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
        updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null
      };
    });

    return NextResponse.json({
      applications: applications,
      total: applications.length
    });
  } catch (error) {
    console.error('Admin pending advisors error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending advisor applications' },
      { status: 500 }
    );
  }
}

