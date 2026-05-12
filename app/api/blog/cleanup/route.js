const logger = require('../../../lib/logger');
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

// DELETE /api/blog/cleanup - Delete all unpublished blog posts
export async function DELETE(request) {
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
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Delete all unpublished/draft blog posts
    const { rows } = await pool.query(
      "DELETE FROM blog_posts WHERE status != 'published' RETURNING id, title, status"
    );

    return NextResponse.json({
      success: true,
      message: `Deleted ${rows.length} unpublished blog post(s)`,
      deleted: rows
    });

  } catch (error) {
    logger.error('Cleanup blog posts error:', error);
    return NextResponse.json({ error: 'Failed to cleanup blog posts' }, { status: 500 });
  }
}


