#!/usr/bin/env node
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.TEST_DATABASE_URL,
  ssl: false,
});

const MONTH_MAPPING = { month_2: 2, month_3: 3 };
const WEEK_OFFSETS = { month_2: 5, month_3: 9 };

const PRIORITY_MAP = { high: 'high', medium: 'medium', low: 'low' };

async function loadBriefs() {
  const filePath = path.join(__dirname, '..', 'csg', 'content-briefs-months-2-3.json');
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const data = raw.content_briefs_months_2_3;
  const posts = [];
  for (const [monthKey, monthData] of Object.entries(data)) {
    if (!monthData.posts) continue;
    const monthNum = MONTH_MAPPING[monthKey];
    const weekOffset = WEEK_OFFSETS[monthKey];
    for (const post of monthData.posts) {
      posts.push({ ...post, month_number: monthNum, week_offset: weekOffset });
    }
  }
  return posts;
}

async function main() {
  console.log('Seeding content calendar with months 2-3 briefs...');
  const posts = await loadBriefs();
  console.log(`Found ${posts.length} posts to seed.`);

  for (const post of posts) {
    const pubDate = new Date(2026, 5 + post.month_number - 2, 1);
    pubDate.setDate(pubDate.getDate() + ((post.post_number - 9) % 4) * 4);

    const result = await pool.query(`
      INSERT INTO content_calendar (title, target_keyword, content_type, status, priority, publish_date, week_number, month_number, notes)
      VALUES ($1, $2, $3, 'planned', $4, $5, $6, $7, $8)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [
      post.title_suggestions[0],
      post.target_keyword,
      post.content_type,
      PRIORITY_MAP[post.priority] || 'medium',
      pubDate.toISOString().split('T')[0],
      post.post_number,
      post.month_number,
      `Seeded from months 2-3 briefs. Intents: ${post.search_intent}`,
    ]);

    if (result.rows.length === 0) {
      console.log(`  Skipped post ${post.post_number} — already exists`);
      continue;
    }

    const calendarId = result.rows[0].id;
    console.log(`  Created calendar entry #${post.post_number}: ${post.title_suggestions[0].slice(0, 50)}... (id=${calendarId})`);

    await pool.query(`
      INSERT INTO content_briefs (calendar_id, target_keyword, search_intent, target_word_count, outline, cta_strategy)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      calendarId,
      post.target_keyword,
      post.search_intent.split(' - ')[0] || 'informational',
      post.target_word_count || 2000,
      JSON.stringify(post.h2_headings || []),
      post.cta || '',
    ]);

    for (const step of ['research', 'outline', 'draft', 'edit', 'seo_review', 'images', 'schedule', 'publish', 'promote']) {
      const daysBefore = { research: 14, outline: 10, draft: 7, edit: 4, seo_review: 3, images: 2, schedule: 1, publish: 0, promote: -1 }[step];
      const due = new Date(pubDate);
      due.setDate(due.getDate() - daysBefore);
      await pool.query(`
        INSERT INTO publishing_workflow (calendar_id, step_name, status, due_date)
        VALUES ($1, $2, 'pending', $3)
      `, [calendarId, step, due.toISOString().split('T')[0]]);
    }

    console.log(`    → brief + 9 workflow steps created`);
  }

  console.log('\nDone. Verify with: SELECT count(*) FROM content_calendar;');
  await pool.end();
}

main().catch(err => { console.error('Seed failed:', err); process.exit(1); });
