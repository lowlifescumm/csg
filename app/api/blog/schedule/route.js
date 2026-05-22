const logger = require('../../../../lib/logger');
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/blog/schedule
 * Schedule a blog post for future publication
 * Requires admin authentication
 */
export async function POST(request) {
  try {
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

    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      featured_image,
      tags = [],
      category,
      meta_title,
      meta_description,
      publish_at, // ISO 8601 timestamp string
      author_id
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (!publish_at) {
      return NextResponse.json({ error: 'publish_at timestamp is required' }, { status: 400 });
    }

    // Validate publish_at is in the future
    const publishDate = new Date(publish_at);
    if (isNaN(publishDate.getTime())) {
      return NextResponse.json({ error: 'Invalid publish_at date format. Use ISO 8601 format.' }, { status: 400 });
    }

    if (publishDate <= new Date()) {
      return NextResponse.json({ error: 'publish_at must be in the future' }, { status: 400 });
    }

    // Ensure tags is always an array
    const tagsArray = Array.isArray(tags) ? tags : (tags ? [tags] : []);

    // Generate slug if not provided
    let finalSlug = slug || title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const { rows: existingSlug } = await pool.query(
      'SELECT id FROM blog_posts WHERE slug = $1',
      [finalSlug]
    );

    if (existingSlug.length > 0) {
      // Append timestamp to make it unique
      finalSlug = `${finalSlug}-${Date.now()}`;
    }

    // Insert scheduled post with status 'draft' and future published_at
    const insertQuery = `
      INSERT INTO blog_posts (
        title, slug, excerpt, content, featured_image,
        status, published_at, tags, category,
        meta_title, meta_description, author_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING id, title, slug, status, published_at, created_at
    `;

    const { rows } = await pool.query(insertQuery, [
      title,
      finalSlug,
      excerpt || null,
      content,
      featured_image || null,
      'draft', // Status is draft until publish_at time
      publishDate.toISOString(),
      tagsArray,
      category || null,
      meta_title || null,
      meta_description || null,
      author_id || decoded.userId
    ]);

    return NextResponse.json({
      success: true,
      post: rows[0],
      message: `Post scheduled for publication on ${publishDate.toISOString()}`
    }, { status: 201 });

  } catch (error) {
    logger.error('Schedule blog post error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule blog post', details: error.message },
      { status: 500 }
    );
  }
}

