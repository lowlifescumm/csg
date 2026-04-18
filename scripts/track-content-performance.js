#!/usr/bin/env node
/**
 * Content Performance Tracker
 * 
 * This script tracks organic traffic, signups, and conversions per blog post.
 * It should be run weekly (e.g., via cron) to collect metrics.
 * 
 * Usage: node scripts/track-content-performance.js [--date=YYYY-MM-DD]
 */

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function trackPerformance(date = new Date().toISOString().split('T')[0]) {
  console.log(`📊 Tracking content performance for ${date}...\n`);

  try {
    // Get all published posts from content calendar
    const { rows: calendarItems } = await pool.query(`
      SELECT 
        cc.id as calendar_id,
        cc.post_id,
        cc.title,
        cc.target_keyword,
        cc.target_url_slug,
        cc.publish_date
      FROM content_calendar cc
      WHERE cc.status = 'published' AND cc.post_id IS NOT NULL
    `);

    console.log(`Found ${calendarItems.length} published posts to track\n`);

    for (const item of calendarItems) {
      console.log(`Processing: ${item.title}`);
      
      // Note: In production, you would integrate with:
      // - Google Analytics API for traffic data
      // - Your signup tracking for conversions
      // - Search Console API for ranking data
      
      // For now, we'll create placeholder entries that can be updated
      // via manual entry or future API integration
      
      await pool.query(`
        INSERT INTO content_performance (
          post_id, calendar_id, recorded_at,
          organic_sessions, page_views, unique_visitors,
          email_signups, free_readings_triggered, premium_conversions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (post_id, recorded_at) DO NOTHING
      `, [
        item.post_id,
        item.calendar_id,
        date,
        0, // organic_sessions - to be filled by GA4 API
        0, // page_views
        0, // unique_visitors
        0, // email_signups - to be filled by signup tracking
        0, // free_readings_triggered
        0  // premium_conversions
      ]);
      
      console.log(`  ✓ Recorded metrics placeholder\n`);
    }

    console.log('\n✅ Performance tracking complete!');
    console.log('\nNext steps:');
    console.log('1. Connect Google Analytics 4 API for traffic data');
    console.log('2. Connect Search Console API for ranking data');
    console.log('3. Automate this script to run weekly via cron');
    console.log('4. View results in admin dashboard at /admin/content-calendar');

  } catch (error) {
    console.error('❌ Error tracking performance:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get date from args
const dateArg = process.argv.find(arg => arg.startsWith('--date='));
const date = dateArg ? dateArg.split('=')[1] : undefined;

trackPerformance(date);
