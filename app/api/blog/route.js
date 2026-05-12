const logger = require('../../../lib/logger');
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

// use shared pool from lib/db which handles SSL for local/prod

// GET /api/blog - List blog posts
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'published';

    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [];
    let paramCount = 0;

    // Handle status filter
    if (status === 'all') {
      whereClause = ''; // No status filter - show all posts
    } else {
      whereClause = 'WHERE status = $1';
      queryParams = [status];
      paramCount = 1;
    }

    if (category) {
      paramCount++;
      whereClause += whereClause ? ` AND category = $${paramCount}` : `WHERE category = $${paramCount}`;
      queryParams.push(category);
    }

    if (tag) {
      paramCount++;
      whereClause += whereClause ? ` AND $${paramCount} = ANY(tags)` : `WHERE $${paramCount} = ANY(tags)`;
      queryParams.push(tag);
    }

    if (search) {
      paramCount++;
      whereClause += whereClause ? ` AND (title ILIKE $${paramCount} OR content ILIKE $${paramCount} OR excerpt ILIKE $${paramCount})` : `WHERE (title ILIKE $${paramCount} OR content ILIKE $${paramCount} OR excerpt ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM blog_posts 
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get posts
    const postsQuery = `
      SELECT 
        bp.*,
        u.first_name as author_name,
        u.last_name as author_last_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      ${whereClause}
      ORDER BY bp.published_at DESC, bp.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    queryParams.push(limit, offset);
    const postsResult = await pool.query(postsQuery, queryParams);

    return NextResponse.json({
      posts: postsResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Blog API error:', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}

// Auth helper: supports both cookie (browser) and API key (programmatic)
async function authenticate(request) {
  // Check API key first (for programmatic access)
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    if (!process.env.BLOG_API_KEY || apiKey !== process.env.BLOG_API_KEY) {
      return { error: 'Invalid API key', status: 401 };
    }
    // API key is valid — use service account (userId = 1 or first admin found)
    const { rows } = await pool.query(
      "SELECT id FROM users WHERE role='admin' ORDER BY id ASC LIMIT 1"
    );
    return rows[0] ? { userId: rows[0].id, isAdmin: true } : { error: 'No admin found', status: 500 };
  }

  // Fall back to cookie auth
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return { error: 'Unauthorized', status: 401 };

  const decoded = verifyToken(token);
  if (!decoded) return { error: 'Unauthorized', status: 401 };

  const { rows: userRows } = await pool.query(
    "SELECT role FROM users WHERE id=$1",
    [decoded.userId]
  );
  if (!userRows[0] || userRows[0].role !== 'admin') {
    return { error: 'Forbidden', status: 403 };
  }
  return { userId: decoded.userId, isAdmin: true };
}

// POST /api/blog - Create new blog post
export async function POST(request) {
  try {
    const auth = await authenticate(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      featured_image,
      status = 'draft',
      tags = [],
      category,
      meta_title,
      meta_description,
      author_id
    } = body;

    // Only require title for drafts, require both title and content for published posts
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    if (status === 'published' && !content) {
      return NextResponse.json({ error: 'Content is required to publish' }, { status: 400 });
    }
    
    // Ensure tags is always an array
    const tagsArray = Array.isArray(tags) ? tags : (tags ? [tags] : []);

    // Create blog_posts table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        excerpt TEXT,
        content TEXT,
        featured_image VARCHAR(500),
        status VARCHAR(20) DEFAULT 'draft',
        tags TEXT[],
        category VARCHAR(100),
        meta_title VARCHAR(255),
        meta_description TEXT,
        author_id INTEGER REFERENCES users(id),
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Modify existing table to allow NULL content if it was previously NOT NULL
    try {
      await pool.query(`
        ALTER TABLE blog_posts 
        ALTER COLUMN content DROP NOT NULL
      `);
    } catch (error) {
      // Column might already allow NULL or table doesn't exist yet, ignore error
    }

    // Check if slug already exists and generate a unique one if needed
    let finalSlug = slug;
    let counter = 1;
    
    while (true) {
      const { rows: existingSlug } = await pool.query(
        'SELECT id FROM blog_posts WHERE slug = $1',
        [finalSlug]
      );
      
      if (existingSlug.length === 0) {
        break; // Slug is unique
      }
      
      // Generate new slug with counter
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    // Insert new blog post
    const { rows } = await pool.query(`
      INSERT INTO blog_posts (
        title, slug, excerpt, content, featured_image, status, tags, category,
        meta_title, meta_description, author_id, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, title, slug, status, created_at
    `, [
      title,
      finalSlug,
      excerpt,
      content,
      featured_image,
      status,
      tagsArray,
      category,
      meta_title,
      meta_description,
        author_id || auth.userId,
      status === 'published' ? new Date() : null
    ]);

    return NextResponse.json({
      success: true,
      post: rows[0]
    });

  } catch (error) {
    logger.error('Create blog post error:', error);
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
  }
}

// PUT /api/blog - Update blog post
export async function PUT(request) {
  try {
    const auth = await authenticate(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { id, title, slug, excerpt, content, featured_image, status, tags, category, meta_title, meta_description } = body;

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Ensure tags is always an array
    const tagsArray = Array.isArray(tags) ? tags : (tags ? [tags] : []);
    
    // Ensure all values are not undefined (convert to null for PostgreSQL)
    const safeData = {
      title: title ?? '',
      slug: slug ?? '',
      excerpt: excerpt ?? '',
      content: content ?? null,
      featured_image: featured_image ?? '',
      status: status ?? 'draft',
      tags: tagsArray,
      category: category ?? '',
      meta_title: meta_title ?? '',
      meta_description: meta_description ?? ''
    };

    // Update blog post - handle published_at separately to avoid parameter reuse issues
    const publishedAtUpdate = safeData.status === 'published' ? 
      `published_at = CASE WHEN published_at IS NULL THEN NOW() ELSE published_at END` :
      `published_at = published_at`;
    
    const { rows } = await pool.query(`
      UPDATE blog_posts 
      SET title = $1, slug = $2, excerpt = $3, content = $4, featured_image = $5, 
          status = $6, tags = $7, category = $8, meta_title = $9, meta_description = $10,
          updated_at = NOW(), ${publishedAtUpdate}
      WHERE id = $11
      RETURNING id, title, slug, status, updated_at
    `, [
      safeData.title,
      safeData.slug,
      safeData.excerpt,
      safeData.content,
      safeData.featured_image,
      safeData.status,
      safeData.tags,
      safeData.category,
      safeData.meta_title,
      safeData.meta_description,
      id
    ]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      post: rows[0]
    });

  } catch (error) {
    logger.error('Update blog post error:', error);
    return NextResponse.json({ 
      error: 'Failed to update blog post', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// DELETE /api/blog - Delete blog post
export async function DELETE(request) {
  try {
    const auth = await authenticate(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Delete blog post
    const { rows } = await pool.query('DELETE FROM blog_posts WHERE id = $1 RETURNING id', [id]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Delete blog post error:', error);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}