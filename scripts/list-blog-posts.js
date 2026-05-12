const logger = require('./lib/logger');
#!/usr/bin/env node

/**
 * List all blog posts in the database
 */

import { pool } from '../lib/db.js';

async function listBlogPosts() {
  try {
    logger.info('Fetching all blog posts...\n');
    
    const result = await pool.query(`
      SELECT 
        id,
        title,
        slug,
        status,
        created_at,
        published_at
      FROM blog_posts
      ORDER BY created_at DESC
    `);

    if (result.rows.length === 0) {
      logger.info('No blog posts found.');
      return;
    }

    logger.info(`Found ${result.rows.length} blog posts:\n`);
    logger.info('┌─────────────────────────────────────────────────────────────────────────────┐');
    logger.info('│ ID │ Title                                          │ Status      │ Date  │');
    logger.info('├─────────────────────────────────────────────────────────────────────────────┤');

    result.rows.forEach(post => {
      const id = String(post.id).padEnd(3);
      const title = post.title.substring(0, 45).padEnd(45);
      const status = post.status.padEnd(11);
      const date = new Date(post.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }).padEnd(10);
      
      logger.info(`│ ${id} │ ${title} │ ${status} │ ${date} │`);
    });

    logger.info('└─────────────────────────────────────────────────────────────────────────────┘');
    
  } catch (error) {
    logger.error('Error listing blog posts:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

listBlogPosts();

