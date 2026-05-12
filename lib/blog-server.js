const logger = require('./lib/logger');
import { pool } from './db';

export async function getBlogPosts({ page = 1, limit = 9, category = '', tag = '', search = '' } = {}) {
  try {
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE status = $1';
    let queryParams = ['published'];
    let paramCount = 1;

    if (category) {
      paramCount++;
      whereClause += ` AND category = $${paramCount}`;
      queryParams.push(category);
    }

    if (tag) {
      paramCount++;
      whereClause += ` AND $${paramCount} = ANY(tags)`;
      queryParams.push(tag);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (title ILIKE $${paramCount} OR content ILIKE $${paramCount} OR excerpt ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM blog_posts ${whereClause}`;
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
    
    const postsResult = await pool.query(postsQuery, [...queryParams, limit, offset]);

    return {
      posts: postsResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Failed to fetch blog posts:', error);
    return { posts: [], pagination: { page: 1, limit, total: 0, pages: 0 } };
  }
}

export async function getBlogPostBySlug(slug) {
  try {
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
      return null;
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

    return { post, related: relatedResult.rows };
  } catch (error) {
    logger.error('Failed to fetch blog post:', error);
    return null;
  }
}

export async function getBlogCategories() {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT category as slug, category as name 
      FROM blog_posts 
      WHERE status = 'published' AND category IS NOT NULL
      ORDER BY category
    `);
    return rows;
  } catch (error) {
    logger.error('Failed to fetch categories:', error);
    return [];
  }
}

export async function getBlogTags() {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT unnest(tags) as slug, unnest(tags) as name 
      FROM blog_posts 
      WHERE status = 'published' AND tags IS NOT NULL
      ORDER BY 1
    `);
    return rows;
  } catch (error) {
    logger.error('Failed to fetch tags:', error);
    return [];
  }
}
