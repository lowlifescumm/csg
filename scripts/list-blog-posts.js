#!/usr/bin/env node
/**
 * @fileoverview This script lists all blog posts currently in the database.
 * It displays a formatted table with each post's ID, title, status, and creation date.
 *
 * @usage
 * To run this script, use the following command:
 * node scripts/list-blog-posts.js
 */

import { pool } from '../lib/db.js';

/**
 * Fetches and displays a list of all blog posts from the database.
 */
async function listBlogPosts() {
  try {
    console.log('Fetching all blog posts...\n');
    
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
      console.log('No blog posts found.');
      return;
    }

    console.log(`Found ${result.rows.length} blog posts:\n`);
    console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
    console.log('│ ID │ Title                                          │ Status      │ Date  │');
    console.log('├─────────────────────────────────────────────────────────────────────────────┤');

    result.rows.forEach(post => {
      const id = String(post.id).padEnd(3);
      const title = post.title.substring(0, 45).padEnd(45);
      const status = post.status.padEnd(11);
      const date = new Date(post.created_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }).padEnd(10);
      
      console.log(`│ ${id} │ ${title} │ ${status} │ ${date} │`);
    });

    console.log('└─────────────────────────────────────────────────────────────────────────────┘');
    
  } catch (error) {
    console.error('Error listing blog posts:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

listBlogPosts();
