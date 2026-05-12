const logger = require('../../../lib/logger');
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
    // Use a subquery to avoid conflicts on both name and slug
    await pool.query(`
      INSERT INTO blog_tags (name, slug)
      SELECT DISTINCT 
        tag_name as name,
        lower(replace(tag_name, ' ', '-')) as slug
      FROM (
        SELECT unnest(tags) as tag_name
        FROM blog_posts 
        WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
      ) AS unique_tags
      WHERE NOT EXISTS (
        SELECT 1 FROM blog_tags 
        WHERE name = unique_tags.tag_name OR slug = lower(replace(unique_tags.tag_name, ' ', '-'))
      )
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
    logger.error('Blog tags API error:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}
