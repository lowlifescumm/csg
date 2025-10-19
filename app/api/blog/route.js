import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// GET /api/blog - List blog posts
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'published';

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE status = $1';
    let queryParams = [status];
    let paramCount = 1;

    if (category) {
      paramCount++;
      whereClause += ` AND category = $${paramCount}`;
      queryParams.push(category);
    }

    if (tag) {
      paramCount++;
      whereClause += ` AND $${paramCount + 1} = ANY(tags)`;
      queryParams.push(tag);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (title ILIKE $${paramCount + 1} OR content ILIKE $${paramCount + 1} OR excerpt ILIKE $${paramCount + 1})`;
      queryParams.push(`%${search}%`);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM blog_posts 
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get posts
    const postsQuery = `
      SELECT 
        bp.*,
        u.first_name as author_name,
        u.last_name as author_last_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      ${whereClause}
      ORDER BY bp.published_at DESC, bp.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    queryParams.push(limit, offset);
    const postsResult = await pool.query(postsQuery, queryParams);

    return NextResponse.json({
      posts: postsResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Blog API error:', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}
