import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// GET /api/blog/tags - Get all blog tags
export async function GET() {
  try {
    const query = `
      SELECT 
        bt.*,
        COUNT(bp.id) as post_count
      FROM blog_tags bt
      LEFT JOIN blog_posts bp ON bt.slug = ANY(bp.tags) AND bp.status = 'published'
      GROUP BY bt.id, bt.name, bt.slug, bt.created_at
      ORDER BY bt.name
    `;

    const result = await pool.query(query);
    
    return NextResponse.json({
      tags: result.rows
    });

  } catch (error) {
    console.error('Blog tags API error:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}
