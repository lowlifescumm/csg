#!/usr/bin/env node
/**
 * Migrate file-based content briefs into the calendar DB.
 *
 * Reads content-briefs-month-1.json and content-briefs-months-2-3.json,
 * inserts entries into content_calendar + content_briefs + publishing_workflow.
 * Skips keywords already in the calendar (dedup by target_keyword).
 *
 * Run: node scripts/migrate-briefs-to-calendar.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const MONTH_1_PATH = path.join(__dirname, 'content-briefs-month-1.json');
const MONTHS_2_3_PATH = path.join(__dirname, 'content-briefs-months-2-3.json');

const WEEK_OFFSETS = { 1: 13, 2: 14, 3: 15, 4: 16 };

function slugify(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function computeWeekAndMonth(index, total) {
  if (index < 8) {
    return { week_number: 13 + index, month_number: 1 };
  }
  const idx = index - 8;
  if (idx < 8) {
    return { week_number: 17 + idx, month_number: 2 };
  }
  const idx2 = index - 16;
  return { week_number: 21 + idx2, month_number: 3 };
}

function computePublishDate(week_number, month_number) {
  const baseMonths = { 1: 5, 2: 6, 3: 7 };
  const month = baseMonths[month_number] || 5;
  const day = 1 + (week_number - 13) * 3;
  return `2026-${String(month).padStart(2, '0')}-${String(Math.min(day, 28)).padStart(2, '0')}`;
}

function loadMonth1Briefs() {
  const raw = JSON.parse(fs.readFileSync(MONTH_1_PATH, 'utf8'));
  return raw.map((b, i) => ({
    source: 'month-1',
    post_number: b.post_number,
    target_keyword: b.target_keyword,
    title: (b.title_options || [])[0] || '',
    title_options: b.title_options || [],
    meta_description: b.meta_description || '',
    search_intent: b.search_intent || 'informational',
    target_word_count: b.target_word_count || 1500,
    h2_headings: b.h2_headings || [],
    internal_linking: b.internal_linking || [],
    cta: b.cta || '',
  }));
}

function loadMonths23Briefs() {
  const raw = JSON.parse(fs.readFileSync(MONTHS_2_3_PATH, 'utf8'));
  const posts = [];
  const m2 = raw.content_briefs_months_2_3?.month_2?.posts || [];
  const m3 = raw.content_briefs_months_2_3?.month_3?.posts || [];

  for (const p of [...m2, ...m3]) {
    posts.push({
      source: 'months-2-3',
      post_number: p.post_number,
      target_keyword: p.target_keyword,
      title: (p.title_suggestions || [])[0] || '',
      title_options: p.title_suggestions || [],
      meta_description: '',
      search_intent: (p.search_intent || '').split(' - ')[0] || 'informational',
      target_word_count: p.target_word_count || 1500,
      h2_headings: p.h2_headings || [],
      internal_linking: p.internal_linking || [],
      cta: p.cta || '',
      priority: p.priority || 'medium',
    });
  }

  return posts;
}

async function migrate() {
  console.log('\n=== Migrating File Briefs to Calendar DB ===\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')) ? false : { rejectUnauthorized: false },
  });

  const allBriefs = [...loadMonth1Briefs(), ...loadMonths23Briefs()];
  console.log(`Loaded ${allBriefs.length} briefs from files (${allBriefs.filter(b => b.source === 'month-1').length} month-1, ${allBriefs.filter(b => b.source === 'months-2-3').length} months-2-3)\n`);

  // Get existing keywords in the calendar
  const { rows: existing } = await pool.query(
    'SELECT target_keyword, id FROM content_calendar WHERE target_keyword IS NOT NULL'
  );
  const existingKeywords = new Set(existing.map(r => r.target_keyword));

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < allBriefs.length; i++) {
    const brief = allBriefs[i];

    if (existingKeywords.has(brief.target_keyword)) {
      console.log(`  SKIP  [#${brief.post_number}] "${brief.target_keyword}" — already in calendar`);
      skipped++;
      continue;
    }

    const { week_number, month_number } = computeWeekAndMonth(i, allBriefs.length);
    const publish_date = brief.source === 'month-1'
      ? computePublishDate(week_number, month_number)
      : computePublishDate(week_number, month_number);

    try {
      await pool.query('BEGIN');

      // 1. Insert into content_calendar
      const calResult = await pool.query(`
        INSERT INTO content_calendar
          (title, target_keyword, target_url_slug, content_type, status, priority, publish_date, week_number, month_number, notes)
        VALUES ($1, $2, $3, $4, 'planned', $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        brief.title,
        brief.target_keyword,
        slugify(brief.title),
        'blog_post',
        brief.priority || 'medium',
        publish_date,
        week_number,
        month_number,
        brief.meta_description || `Guide to ${brief.target_keyword}`,
      ]);
      const calendarId = calResult.rows[0].id;

      // 2. Insert into content_briefs
      await pool.query(`
        INSERT INTO content_briefs
          (calendar_id, target_keyword, secondary_keywords, search_intent, target_word_count, outline, key_points, cta_strategy)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        calendarId,
        brief.target_keyword,
        brief.internal_linking,
        brief.search_intent,
        brief.target_word_count,
        JSON.stringify(brief.h2_headings),
        brief.internal_linking,
        brief.cta,
      ]);

      // 3. Insert publishing_workflow steps
      const workflowSteps = [
        { step: 'research', days: 14 },
        { step: 'outline', days: 10 },
        { step: 'draft', days: 7 },
        { step: 'edit', days: 4 },
        { step: 'seo_review', days: 3 },
        { step: 'images', days: 2 },
        { step: 'schedule', days: 1 },
        { step: 'publish', days: 0 },
        { step: 'promote', days: -1 },
      ];

      for (const { step, days } of workflowSteps) {
        const due = new Date(publish_date);
        due.setDate(due.getDate() - days);
        await pool.query(`
          INSERT INTO publishing_workflow (calendar_id, step_name, status, due_date)
          VALUES ($1, $2, 'pending', $3)
        `, [calendarId, step, due.toISOString().split('T')[0]]);
      }

      await pool.query('COMMIT');
      console.log(`  INSERT [#${brief.post_number}] "${brief.target_keyword}" → calendar id ${calendarId}`);
      inserted++;

    } catch (err) {
      await pool.query('ROLLBACK');
      console.error(`  ERROR  [#${brief.post_number}] "${brief.target_keyword}": ${err.message}`);
      errors++;
    }
  }

  console.log(`\n=== Done: ${inserted} inserted, ${skipped} skipped, ${errors} errors ===\n`);

  // Verify
  const { rows: total } = await pool.query('SELECT COUNT(*) FROM content_calendar');
  const { rows: briefCount } = await pool.query('SELECT COUNT(*) FROM content_briefs');
  console.log(`Calendar total: ${total[0].count} entries`);
  console.log(`Briefs total:   ${briefCount[0].count} entries`);

  await pool.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
