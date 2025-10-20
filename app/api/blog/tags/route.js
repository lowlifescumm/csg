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
    // Create blog_tags table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blog_tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get all unique tags from blog posts and insert them into blog_tags if they don't exist
    await pool.query(`
      INSERT INTO blog_tags (name, slug)
      SELECT DISTINCT 
        unnest(tags) as name,
        lower(replace(unnest(tags), ' ', '-')) as slug
      FROM blog_posts 
      WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
      ON CONFLICT (name) DO NOTHING
    `);

    const query = `
      SELECT 
        bt.*,
        COUNT(bp.id) as post_count
      FROM blog_tags bt
      LEFT JOIN blog_posts bp ON bt.name = ANY(bp.tags) AND bp.status = 'published'
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
