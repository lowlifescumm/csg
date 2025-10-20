import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// GET /api/blog/[id] - Get single blog post by ID (for admin editing)
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Check authentication for admin access
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

    const postQuery = `
      SELECT 
        bp.*,
        u.first_name as author_name,
        u.last_name as author_last_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.id = $1
    `;

    const postResult = await pool.query(postQuery, [id]);

    if (postResult.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = postResult.rows[0];

    return NextResponse.json({
      post
    });

  } catch (error) {
    console.error('Blog post API error:', error);
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
  }
}

// DELETE /api/blog/[id] - Delete blog post
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Check authentication for admin access
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

    // Delete blog post
    const { rows } = await pool.query('DELETE FROM blog_posts WHERE id = $1 RETURNING id', [id]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete blog post error:', error);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}
