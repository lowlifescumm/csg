const logger = require('../../../../lib/logger');
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// GET /api/blog/categories - Get all blog categories
export async function GET() {
  try {
    // Get all distinct categories directly from blog_posts
    // No separate blog_categories table needed
    const result = await pool.query(`
      SELECT 
        category as name,
        lower(regexp_replace(category, '[^a-zA-Z0-9]+', '-', 'g')) as slug,
        COUNT(*) as post_count
      FROM blog_posts 
      WHERE category IS NOT NULL 
        AND category != ''
        AND status = 'published'
      GROUP BY category
      ORDER BY category
    `);
    
    return NextResponse.json({
      categories: result.rows
    });

  } catch (error) {
    logger.error('Blog categories API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch categories',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
