import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// GET /api/blog/categories - Get all blog categories
export async function GET() {
  try {
    // Create blog_categories table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blog_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get all unique categories from blog posts and insert them into blog_categories if they don't exist
    // Use ON CONFLICT DO NOTHING to handle duplicates and long names
    await pool.query(`
      INSERT INTO blog_categories (name, slug)
      SELECT DISTINCT 
        category as name,
        lower(regexp_replace(category, '[^a-zA-Z0-9]+', '-', 'g')) as slug
      FROM blog_posts 
      WHERE category IS NOT NULL AND category != ''
      ON CONFLICT (name) DO NOTHING
    `);

    const query = `
      SELECT 
        bc.*,
        COUNT(bp.id) as post_count
      FROM blog_categories bc
      LEFT JOIN blog_posts bp ON bc.name = bp.category AND bp.status = 'published'
      GROUP BY bc.id, bc.name, bc.slug, bc.description, bc.created_at
      ORDER BY bc.name
    `;

    const result = await pool.query(query);
    
    return NextResponse.json({
      categories: result.rows
    });

  } catch (error) {
    console.error('Blog categories API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch categories',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
