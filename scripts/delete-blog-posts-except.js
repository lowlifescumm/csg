#!/usr/bin/env node
/**
 * @fileoverview This script deletes all blog posts from the database except for the one with a specified slug.
 * It prompts the user for confirmation before deleting any posts.
 *
 * @usage
 * To run this script, use the following command, replacing `<slug-to-keep>` with the slug of the post you want to preserve:
 * node scripts/delete-blog-posts-except.js <slug-to-keep>
 *
 * @example
 * node scripts/delete-blog-posts-except.js "the-future-of-intuition-how-ai-is-transforming-spiritual-guidance"
 */
import { pool } from '../lib/db.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Asks a question in the command line and returns the user's answer.
 * @param {string} query - The question to ask the user.
 * @returns {Promise<string>} The user's answer.
 */
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * Deletes all blog posts except for the one with the specified slug.
 * @param {string} slugToKeep - The slug of the blog post to keep.
 */
async function deletePostsExcept(slugToKeep) {
  try {
    console.log('\nFetching all blog posts...\n');
    
    const allPosts = await pool.query(`
      SELECT id, title, slug, status, created_at
      FROM blog_posts
      ORDER BY created_at DESC
    `);

    if (allPosts.rows.length === 0) {
      console.log('No blog posts found.');
      return;
    }

    const keepPost = allPosts.rows.find(p => p.slug === slugToKeep);
    
    if (!keepPost) {
      console.log(`\n❌ Post with slug "${slugToKeep}" not found.\n`);
      console.log('Available posts:');
      allPosts.rows.forEach(post => {
        console.log(`  - ID ${post.id}: "${post.title}" (${post.slug})`);
      });
      return;
    }

    const postsToDelete = allPosts.rows.filter(p => p.id !== keepPost.id);

    if (postsToDelete.length === 0) {
      console.log('\n✅ No posts to delete. Only the target post exists.');
      return;
    }

    console.log('\n📋 Posts that will be DELETED:');
    console.log('─────────────────────────────────────────────────────────────────');
    postsToDelete.forEach(post => {
      console.log(`  ❌ ID ${post.id}: "${post.title}" (${post.slug})`);
    });

    console.log(`\n✅ Post that will be KEPT:`);
    console.log(`  ✓  ID ${keepPost.id}: "${keepPost.title}" (${keepPost.slug})`);

    console.log(`\n⚠️  You are about to delete ${postsToDelete.length} blog post(s).`);
    const answer = await askQuestion('Are you sure you want to proceed? (yes/no): ');

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('\n❌ Deletion cancelled.');
      return;
    }

    console.log('\n🗑️  Deleting posts...\n');
    
    for (const post of postsToDelete) {
      try {
        await pool.query('DELETE FROM blog_posts WHERE id = $1', [post.id]);
        console.log(`  ✓ Deleted: "${post.title}" (ID: ${post.id})`);
      } catch (error) {
        console.error(`  ❌ Failed to delete "${post.title}": ${error.message}`);
      }
    }

    console.log(`\n✅ Successfully deleted ${postsToDelete.length} post(s).`);
    console.log(`✅ Kept: "${keepPost.title}" (ID: ${keepPost.id})`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await pool.end();
  }
}

const slugToKeep = process.argv[2];

if (!slugToKeep) {
  console.log('Usage: node scripts/delete-blog-posts-except.js <slug-to-keep>');
  console.log('\nExample:');
  console.log('  node scripts/delete-blog-posts-except.js "the-future-of-intuition-how-ai-is-transforming-spiritual-guidance"');
  process.exit(1);
}

deletePostsExcept(slugToKeep);
