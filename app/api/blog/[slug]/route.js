import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// GET /api/blog/[slug] - Get single blog post
export async function GET(request, { params }) {
  try {
    const { slug } = params;

    const postQuery = `
      SELECT 
        bp.*,
        u.first_name as author_name,
        u.last_name as author_last_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.slug = $1 AND bp.status = 'published'
    `;

    const postResult = await pool.query(postQuery, [slug]);

    if (postResult.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = postResult.rows[0];

    // Get related posts
    const relatedQuery = `
      SELECT id, title, slug, excerpt, featured_image, published_at
      FROM blog_posts 
      WHERE status = 'published' 
        AND id != $1 
        AND (category = $2 OR $3 = ANY(tags))
      ORDER BY published_at DESC
      LIMIT 3
    `;
    const relatedResult = await pool.query(relatedQuery, [post.id, post.category, post.tags]);

    // Track view (simple IP-based tracking)
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    try {
      await pool.query(
        'INSERT INTO blog_post_views (post_id, ip_address, user_agent) VALUES ($1, $2, $3)',
        [post.id, clientIP, userAgent]
      );
    } catch (viewError) {
      // Don't fail the request if view tracking fails
      console.log('View tracking error:', viewError.message);
    }

    return NextResponse.json({
      post,
      related: relatedResult.rows
    });

  } catch (error) {
    console.error('Blog post API error:', error);
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
  }
}
