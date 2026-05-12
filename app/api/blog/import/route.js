const logger = require('../../../lib/logger');
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/blog/import
 * Bulk import blog posts from external sources (e.g., autoblogging platform)
 * Requires admin authentication
 * 
 * Accepts an array of blog posts to import
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
    const { posts } = body;

    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json(
        { error: 'posts must be a non-empty array' },
        { status: 400 }
      );
    }

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    // Process each post
    for (const post of posts) {
      try {
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
          published_at,
          author_id
        } = post;

        // Validate required fields
        if (!title || !content) {
          results.failed.push({
            post: title || 'Untitled',
            error: 'Title and content are required'
          });
          continue;
        }

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
          // Skip if duplicate slug (or append timestamp if overwrite is desired)
          results.skipped.push({
            post: title,
            slug: finalSlug,
            reason: 'Slug already exists'
          });
          continue;
        }

        // Ensure tags is always an array
        const tagsArray = Array.isArray(tags) ? tags : (tags ? [tags] : []);

        // Insert post
        const insertQuery = `
          INSERT INTO blog_posts (
            title, slug, excerpt, content, featured_image,
            status, published_at, tags, category,
            meta_title, meta_description, author_id, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
          RETURNING id, title, slug, status
        `;

        const { rows } = await pool.query(insertQuery, [
          title,
          finalSlug,
          excerpt || null,
          content,
          featured_image || null,
          status,
          published_at ? new Date(published_at).toISOString() : null,
          tagsArray,
          category || null,
          meta_title || null,
          meta_description || null,
          author_id || decoded.userId
        ]);

        results.success.push({
          id: rows[0].id,
          title: rows[0].title,
          slug: rows[0].slug,
          status: rows[0].status
        });

      } catch (error) {
        results.failed.push({
          post: post.title || 'Untitled',
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: posts.length,
        successful: results.success.length,
        failed: results.failed.length,
        skipped: results.skipped.length
      },
      results
    }, { status: 200 });

  } catch (error) {
    logger.error('Import blog posts error:', error);
    return NextResponse.json(
      { error: 'Failed to import blog posts', details: error.message },
      { status: 500 }
    );
  }
}

