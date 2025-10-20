import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Simple GET test for blog posts
export async function GET() {
  try {
    console.log('Testing blog API...');
    
    // Simple query to test database connection
    const result = await pool.query('SELECT COUNT(*) as count FROM blog_posts');
    
    return NextResponse.json({ 
      message: 'Blog API working',
      postCount: result.rows[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Blog API error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
