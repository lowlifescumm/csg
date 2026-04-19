import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    // Auth check (cookie only — this endpoint is for human admins)
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { rows } = await pool.query("SELECT role FROM users WHERE id=$1", [decoded.userId]);
    if (!rows[0] || rows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return env var status (not the actual values — just what's set)
    return NextResponse.json({
      BLOG_API_KEY_SET: !!process.env.BLOG_API_KEY,
      BLOG_API_KEY_PREFIX: process.env.BLOG_API_KEY ? process.env.BLOG_API_KEY.slice(0, 4) + '...' : null,
      FAL_KEY_SET: !!process.env.FAL_KEY,
      TWITTER_API_KEY_SET: !!process.env.TWITTER_API_KEY,
      SITE_URL: process.env.SITE_URL || 'https://cosmicspiritguide.com',
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
