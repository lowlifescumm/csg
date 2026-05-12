const logger = require('./lib/logger');
#!/usr/bin/env node

/**
 * Delete all blog posts except the one with the specified slug
 */

import { pool } from '../lib/db.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function deletePostsExcept(slugToKeep) {
  try {
    // First, list all posts
    logger.info('\nFetching all blog posts...\n');
    
    const allPosts = await pool.query(`
      SELECT id, title, slug, status, created_at
      FROM blog_posts
      ORDER BY created_at DESC
    `);

    if (allPosts.rows.length === 0) {
      logger.info('No blog posts found.');
      return;
    }

    // Find the post to keep
    const keepPost = allPosts.rows.find(p => p.slug === slugToKeep);
    
    if (!keepPost) {
      logger.info(`\n❌ Post with slug "${slugToKeep}" not found.\n`);
      logger.info('Available posts:');
      allPosts.rows.forEach(post => {
        logger.info(`  - ID ${post.id}: "${post.title}" (${post.slug})`);
      });
      return;
    }

    // Find posts to delete
    const postsToDelete = allPosts.rows.filter(p => p.id !== keepPost.id);

    if (postsToDelete.length === 0) {
      logger.info('\n✅ No posts to delete. Only the target post exists.');
      return;
    }

    logger.info('\n📋 Posts that will be DELETED:');
    logger.info('─────────────────────────────────────────────────────────────────');
    postsToDelete.forEach(post => {
      logger.info(`  ❌ ID ${post.id}: "${post.title}" (${post.slug})`);
    });

    logger.info(`\n✅ Post that will be KEPT:`);
    logger.info(`  ✓  ID ${keepPost.id}: "${keepPost.title}" (${keepPost.slug})`);

    logger.info(`\n⚠️  You are about to delete ${postsToDelete.length} blog post(s).`);
    const answer = await askQuestion('Are you sure you want to proceed? (yes/no): ');

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      logger.info('\n❌ Deletion cancelled.');
      return;
    }

    // Delete the posts
    logger.info('\n🗑️  Deleting posts...\n');
    
    for (const post of postsToDelete) {
      try {
        await pool.query('DELETE FROM blog_posts WHERE id = $1', [post.id]);
        logger.info(`  ✓ Deleted: "${post.title}" (ID: ${post.id})`);
      } catch (error) {
        logger.error(`  ❌ Failed to delete "${post.title}": ${error.message}`);
      }
    }

    logger.info(`\n✅ Successfully deleted ${postsToDelete.length} post(s).`);
    logger.info(`✅ Kept: "${keepPost.title}" (ID: ${keepPost.id})`);
    
  } catch (error) {
    logger.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

// Get slug from command line args
const slugToKeep = process.argv[2];

if (!slugToKeep) {
  logger.info('Usage: node scripts/delete-blog-posts-except.js <slug-to-keep>');
  logger.info('\nExample:');
  logger.info('  node scripts/delete-blog-posts-except.js "the-future-of-intuition-how-ai-is-transforming-spiritual-guidance"');
  process.exit(1);
}

deletePostsExcept(slugToKeep);

