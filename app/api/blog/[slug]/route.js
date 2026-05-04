import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { fetchPostBySlug, sanityHasBlogPosts } from '@/lib/sanity-blog-api';

export const dynamic = 'force-dynamic';

// ─── GET /api/blog/[slug] — Single post (Sanity first, fallback to PostgreSQL) ──
export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const url = new URL(request.url);
    const isAdmin = url.searchParams.get('admin') === 'true';
    const isNumericId = /^\d+$/.test(slug);

    // ── Attempt 1: Sanity CMS ─────────────────────────────────────
    if (!isNumericId) {
      try {
        const hasPosts = await sanityHasBlogPosts();
        if (hasPosts) {
          const post = await fetchPostBySlug(slug);
          if (post) {
            // For admin requests, just return the post
            if (isAdmin) return NextResponse.json({ post });

            // Get related posts from PostgreSQL fallback (until we build Sanity relation queries)
            const relatedResult = await pool.query(`
              SELECT id, title, slug, excerpt, featured_image, published_at
              FROM blog_posts WHERE status = 'published' AND slug != $1
                AND (category = $2 OR $3 = ANY(tags))
              ORDER BY published_at DESC LIMIT 3`,
              [slug, post.category, post.tags]
            );

            // Track view
            const forwardedFor = request.headers.get('x-forwarded-for') || '';
            const realIP = request.headers.get('x-real-ip') || '';
            let clientIP = forwardedFor.split(',')[0]?.trim() || realIP.trim() || null;
            const userAgent = request.headers.get('user-agent') || 'unknown';

            if (clientIP && !/unknown/.test(clientIP)) {
              try {
                await pool.query(
                  'INSERT INTO blog_post_views (post_id, ip_address, user_agent) VALUES ($1, $2, $3)',
                  [post.id || 0, clientIP, userAgent]
                );
              } catch (e) { console.log('View tracking error:', e.message); }
            }

            return NextResponse.json({ post, related: relatedResult.rows });
          }
        }
      } catch (err) {
        console.warn('Sanity single-post fallback:', err.message);
      }
    }

    // ── Attempt 2: PostgreSQL fallback ─────────────────────────────
    let postQuery, queryParams;
    if (isNumericId && isAdmin) {
      postQuery = `SELECT bp.*, u.first_name as author_name, u.last_name as author_last_name
        FROM blog_posts bp LEFT JOIN users u ON bp.author_id = u.id WHERE bp.id = $1`;
      queryParams = [slug];
    } else {
      postQuery = `SELECT bp.*, u.first_name as author_name, u.last_name as author_last_name
        FROM blog_posts bp LEFT JOIN users u ON bp.author_id = u.id
        WHERE bp.slug = $1 AND bp.status = 'published'`;
      queryParams = [slug];
    }

    const postResult = await pool.query(postQuery, queryParams);
    if (postResult.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = postResult.rows[0];
    if (isAdmin) return NextResponse.json({ post });

    const relatedResult = await pool.query(`
      SELECT id, title, slug, excerpt, featured_image, published_at
      FROM blog_posts WHERE status = 'published' AND id != $1
        AND (category = $2 OR $3 = ANY(tags))
      ORDER BY published_at DESC LIMIT 3`,
      [post.id, post.category, post.tags]
    );

    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    const realIP = request.headers.get('x-real-ip') || '';
    let clientIP = forwardedFor.split(',')[0]?.trim() || realIP.trim() || null;
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (clientIP && !/unknown/.test(clientIP)) {
      try { await pool.query('INSERT INTO blog_post_views (post_id, ip_address, user_agent) VALUES ($1, $2, $3)', [post.id, clientIP, userAgent]); }
      catch (e) { console.log('View tracking error:', e.message); }
    }

    return NextResponse.json({ post, related: relatedResult.rows });

  } catch (error) {
    console.error('Blog post API error:', error);
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
  }
}

// ─── DELETE /api/blog/[slug] — Admin only (PostgreSQL) ─────────
export async function DELETE(request, { params }) {
  try {
    const { slug } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { rows: userRows } = await pool.query("SELECT role FROM users WHERE id=$1", [decoded.userId]);
    if (!userRows[0] || userRows[0].role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (!/^\d+$/.test(slug)) return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });

    const { rows } = await pool.query('DELETE FROM blog_posts WHERE id = $1 RETURNING id', [slug]);
    if (rows.length === 0) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete blog post error:', error);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}
