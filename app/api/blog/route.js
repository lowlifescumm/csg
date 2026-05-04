import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { fetchPostsFromSanity, fetchPostBySlug, sanityHasBlogPosts } from '@/lib/sanity-blog-api';

// ═══════════════════════════════════════════════════════════════
// SANITY-FIRST BLOG API — reads from CMS, falls back to PostgreSQL
// ═══════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

// ─── Auth helper (unchanged) ────────────────────────────────────
async function authenticate(request) {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    if (!process.env.BLOG_API_KEY || apiKey !== process.env.BLOG_API_KEY) {
      return { error: 'Invalid API key', status: 401 };
    }
    const { rows } = await pool.query(
      "SELECT id FROM users WHERE role='admin' ORDER BY id ASC LIMIT 1"
    );
    return rows[0] ? { userId: rows[0].id, isAdmin: true } : { error: 'No admin found', status: 500 };
  }
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return { error: 'Unauthorized', status: 401 };
  const decoded = verifyToken(token);
  if (!decoded) return { error: 'Unauthorized', status: 401 };
  const { rows: userRows } = await pool.query("SELECT role FROM users WHERE id=$1", [decoded.userId]);
  if (!userRows[0] || userRows[0].role !== 'admin') {
    return { error: 'Forbidden', status: 403 };
  }
  return { userId: decoded.userId, isAdmin: true };
}

// ─── GET — List posts (Sanity first, then fallback) ─────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page')) || 1;
  const limit = parseInt(searchParams.get('limit')) || 10;
  const category = searchParams.get('category') || '';
  const tag = searchParams.get('tag') || '';
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'published';

  // ── Attempt 1: Sanity CMS ─────────────────────────────────────
  try {
    const hasPosts = await sanityHasBlogPosts();
    if (hasPosts) {
      const result = await fetchPostsFromSanity({ page, limit, category, tag, search, status });
      return NextResponse.json(result);
    }
    // Sanity has no blog posts yet → fall through to PostgreSQL
  } catch (sanityErr) {
    console.warn('Sanity read failed, falling back to PostgreSQL:', sanityErr.message);
  }

  // ── Attempt 2: PostgreSQL fallback ────────────────────────────
  try {
    const offset = (page - 1) * limit;
    let whereClause = '';
    let queryParams = [];
    let paramCount = 0;

    if (status === 'all') {
      whereClause = '';
    } else {
      whereClause = 'WHERE status = $1';
      queryParams = [status];
      paramCount = 1;
    }

    if (category) { paramCount++; whereClause += whereClause ? ` AND category = $${paramCount}` : `WHERE category = $${paramCount}`; queryParams.push(category); }
    if (tag) { paramCount++; whereClause += whereClause ? ` AND $${paramCount} = ANY(tags)` : `WHERE $${paramCount} = ANY(tags)`; queryParams.push(tag); }
    if (search) { paramCount++; whereClause += whereClause ? ` AND (title ILIKE $${paramCount} OR content ILIKE $${paramCount} OR excerpt ILIKE $${paramCount})` : `WHERE (title ILIKE $${paramCount} OR content ILIKE $${paramCount} OR excerpt ILIKE $${paramCount})`; queryParams.push(`%${search}%`); }

    const countResult = await pool.query(`SELECT COUNT(*) as total FROM blog_posts ${whereClause}`, queryParams);
    const total = parseInt(countResult.rows[0].total);

    const postsResult = await pool.query(`
      SELECT bp.*, u.first_name as author_name, u.last_name as author_last_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      ${whereClause}
      ORDER BY bp.published_at DESC, bp.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...queryParams, limit, offset]
    );

    return NextResponse.json({
      posts: postsResult.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });

  } catch (error) {
    console.error('Blog API error (both Sanity and PostgreSQL failed):', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}

// ─── POST / PUT / DELETE — keep using PostgreSQL until CMS rollout is complete
// The content pipeline will write to BOTH Sanity and PostgreSQL during transition.

export async function POST(request) {
  try {
    const auth = await authenticate(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { title, slug, excerpt, content, featured_image, status = 'draft', tags = [], category, meta_title, meta_description, author_id } = body;

    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (status === 'published' && !content) return NextResponse.json({ error: 'Content is required to publish' }, { status: 400 });

    const tagsArray = Array.isArray(tags) ? tags : (tags ? [tags] : []);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, slug VARCHAR(255) UNIQUE NOT NULL,
        excerpt TEXT, content TEXT, featured_image VARCHAR(500), status VARCHAR(20) DEFAULT 'draft',
        tags TEXT[], category VARCHAR(100), meta_title VARCHAR(255), meta_description TEXT,
        author_id INTEGER REFERENCES users(id), published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())
    `);
    try { await pool.query('ALTER TABLE blog_posts ALTER COLUMN content DROP NOT NULL'); } catch {}

    let finalSlug = slug; let counter = 1;
    while (true) {
      const { rows: existing } = await pool.query('SELECT id FROM blog_posts WHERE slug = $1', [finalSlug]);
      if (existing.length === 0) break;
      finalSlug = `${slug}-${counter}`; counter++;
    }

    const { rows } = await pool.query(`
      INSERT INTO blog_posts (title, slug, excerpt, content, featured_image, status, tags, category,
        meta_title, meta_description, author_id, published_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, title, slug, status, created_at`,
      [title, finalSlug, excerpt, content, featured_image, status, tagsArray, category,
       meta_title, meta_description, author_id || auth.userId, status === 'published' ? new Date() : null]
    );

    return NextResponse.json({ success: true, post: rows[0] });
  } catch (error) {
    console.error('Create blog post error:', error);
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await authenticate(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id, title, slug, excerpt, content, featured_image, status, tags, category, meta_title, meta_description } = body;
    if (!id) return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });

    const tagsArray = Array.isArray(tags) ? tags : (tags ? [tags] : []);
    const safe = { title: title ?? '', slug: slug ?? '', excerpt: excerpt ?? '', content: content ?? null,
      featured_image: featured_image ?? '', status: status ?? 'draft', tags: tagsArray,
      category: category ?? '', meta_title: meta_title ?? '', meta_description: meta_description ?? '' };

    const publishedAtUpdate = safe.status === 'published'
      ? `published_at = CASE WHEN published_at IS NULL THEN NOW() ELSE published_at END`
      : `published_at = published_at`;

    const { rows } = await pool.query(`
      UPDATE blog_posts SET title=$1, slug=$2, excerpt=$3, content=$4, featured_image=$5,
        status=$6, tags=$7, category=$8, meta_title=$9, meta_description=$10,
        updated_at=NOW(), ${publishedAtUpdate}
      WHERE id=$11
      RETURNING id, title, slug, status, updated_at`,
      [safe.title, safe.slug, safe.excerpt, safe.content, safe.featured_image,
       safe.status, safe.tags, safe.category, safe.meta_title, safe.meta_description, id]
    );

    if (rows.length === 0) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    return NextResponse.json({ success: true, post: rows[0] });
  } catch (error) {
    console.error('Update blog post error:', error);
    return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await authenticate(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });

    const { rows } = await pool.query('DELETE FROM blog_posts WHERE id = $1 RETURNING id', [id]);
    if (rows.length === 0) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete blog post error:', error);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}
