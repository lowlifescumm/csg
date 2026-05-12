const logger = require('../../../lib/logger');
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

// use shared pool from lib/db which handles SSL for local/prod

// GET /api/blog/[slug] - Get single blog post (by slug or ID)
export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const url = new URL(request.url);
    const isAdmin = url.searchParams.get('admin') === 'true';

    // Check if slug is actually a numeric ID
    const isNumericId = /^\d+$/.test(slug);
    
    let postQuery;
    let queryParams;
    
    if (isNumericId && isAdmin) {
      // Admin access by ID - no status filter
      postQuery = `
        SELECT 
          bp.*,
          u.first_name as author_name,
          u.last_name as author_last_name
        FROM blog_posts bp
        LEFT JOIN users u ON bp.author_id = u.id
        WHERE bp.id = $1
      `;
      queryParams = [slug];
    } else {
      // Public access by slug - only published posts
      postQuery = `
        SELECT 
          bp.*,
          u.first_name as author_name,
          u.last_name as author_last_name
        FROM blog_posts bp
        LEFT JOIN users u ON bp.author_id = u.id
        WHERE bp.slug = $1 AND bp.status = 'published'
      `;
      queryParams = [slug];
    }

    const postResult = await pool.query(postQuery, queryParams);

    if (postResult.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = postResult.rows[0];

    // For admin requests, just return the post without related posts or view tracking
    if (isAdmin) {
      return NextResponse.json({ post });
    }

    // Get related posts (only for public access)
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
    // Extract IP from headers - x-forwarded-for can contain multiple IPs (client, proxy1, proxy2)
    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    const realIP = request.headers.get('x-real-ip') || '';
    
    // Get the first IP from x-forwarded-for (real client IP, before proxies)
    // Format: "client-ip, proxy1-ip, proxy2-ip" -> we want "client-ip"
    let clientIP = forwardedFor.split(',')[0]?.trim() || realIP.trim() || null;
    
    // Validate IP format (basic check - must be a valid IPv4 or IPv6)
    // PostgreSQL INET type requires valid IP format
    if (clientIP && clientIP !== 'unknown') {
      // Basic IP validation regex (IPv4 and IPv6)
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
      
      if (!ipv4Regex.test(clientIP) && !ipv6Regex.test(clientIP)) {
        // Invalid IP format, set to null to skip tracking
        clientIP = null;
      }
    } else {
      clientIP = null;
    }
    
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Only track if we have a valid IP
    if (clientIP) {
      try {
        await pool.query(
          'INSERT INTO blog_post_views (post_id, ip_address, user_agent) VALUES ($1, $2, $3)',
          [post.id, clientIP, userAgent]
        );
      } catch (viewError) {
        // Don't fail the request if view tracking fails
        logger.info('View tracking error:', viewError.message);
      }
    }

    return NextResponse.json({
      post,
      related: relatedResult.rows
    });

  } catch (error) {
    logger.error('Blog post API error:', error);
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
  }
}

// DELETE /api/blog/[slug] - Delete blog post (admin only)
export async function DELETE(request, { params }) {
  try {
    const { slug } = await params;
    
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

    // Check if slug is actually a numeric ID
    const isNumericId = /^\d+$/.test(slug);
    
    if (!isNumericId) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // Delete blog post
    const { rows } = await pool.query('DELETE FROM blog_posts WHERE id = $1 RETURNING id', [slug]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Delete blog post error:', error);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}
