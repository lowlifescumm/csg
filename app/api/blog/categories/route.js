import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// GET /api/blog/categories - Get all blog categories
export async function GET() {
  try {
    const query = `
      SELECT 
        bc.*,
        COUNT(bp.id) as post_count
      FROM blog_categories bc
      LEFT JOIN blog_posts bp ON bc.slug = bp.category AND bp.status = 'published'
      GROUP BY bc.id, bc.name, bc.slug, bc.description, bc.created_at
      ORDER BY bc.name
    `;

    const result = await pool.query(query);
    
    return NextResponse.json({
      categories: result.rows
    });

  } catch (error) {
    console.error('Blog categories API error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
