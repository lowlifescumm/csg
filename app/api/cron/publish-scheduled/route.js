import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

/**
 * GET /api/cron/publish-scheduled
 * Auto-publish scheduled blog posts that have reached their publish_at time
 * 
 * This endpoint should be called by a cron job (e.g., hourly) to automatically
 * publish posts that were scheduled for future publication.
 * 
 * Protected by CRON_SECRET environment variable
 */
export async function GET(request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    
    // Find all draft posts with published_at in the past
    const scheduledQuery = `
      SELECT id, title, slug, published_at
      FROM blog_posts
      WHERE status = 'draft'
        AND published_at IS NOT NULL
        AND published_at <= $1
      ORDER BY published_at ASC
    `;

    const { rows: scheduledPosts } = await pool.query(scheduledQuery, [now.toISOString()]);

    if (scheduledPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No scheduled posts to publish',
        published: 0
      });
    }

    const published = [];
    const failed = [];

    // Publish each scheduled post
    for (const post of scheduledPosts) {
      try {
        const updateQuery = `
          UPDATE blog_posts
          SET status = 'published',
              updated_at = NOW()
          WHERE id = $1
          RETURNING id, title, slug, status, published_at
        `;

        const { rows } = await pool.query(updateQuery, [post.id]);

        if (rows.length > 0) {
          published.push({
            id: rows[0].id,
            title: rows[0].title,
            slug: rows[0].slug,
            published_at: rows[0].published_at
          });
          console.log(`[Cron] Published scheduled post: ${rows[0].title} (ID: ${rows[0].id})`);
        }
      } catch (error) {
        console.error(`[Cron] Failed to publish post ${post.id}:`, error);
        failed.push({
          id: post.id,
          title: post.title,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${scheduledPosts.length} scheduled posts`,
      published: published.length,
      failed: failed.length,
      results: {
        published,
        failed
      }
    });

  } catch (error) {
    console.error('Publish scheduled posts error:', error);
    return NextResponse.json(
      { error: 'Failed to publish scheduled posts', details: error.message },
      { status: 500 }
    );
  }
}




