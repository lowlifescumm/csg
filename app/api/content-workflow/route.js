/**
 * Content Workflow API — Paperclip Agent Interface
 *
 * Agents call this to:
 *   POST /api/content-workflow  { calendarId, step }           → claim/begin a step
 *   GET  /api/content-workflow?calendarId=X                    → get step details + content brief
 *   DELETE /api/content-workflow?calendarId=X&step=Y          → release a step (unassign)
 *
 * Auth: Bearer token = CRON_SECRET (same as content-pipeline cron)
 *
 * Each step produces:
 *   research     → content_briefs table (keyword, outline, key points)
 *   outline      → blog_posts draft (title, excerpt, slug) or content_briefs.outline JSON
 *   draft        → blog_posts (partial content, status=draft)
 *   edit         → blog_posts (full content, status=review)
 *   seo_review   → blog_posts (meta_title, meta_description, tags updated)
 *   images       → blog_posts (featured_image updated)
 *   schedule     → blog_posts (status=scheduled, published_at set)
 *   publish      → blog_posts (status=published)
 *   promote      → social_copy record created (manual post or auto-post flag)
 */

import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ─── Auth ────────────────────────────────────────────────────────────────────

async function authenticate(req) {
  const authHeader = req.headers.get('authorization') || '';
  const token = (authHeader.match(/^Bearer (.+)$/) || [])[1] || '';
  const secret = (process.env.CRON_SECRET || '').replace(/\r?\n/g, '').trim();
  if (!secret) return { error: 'CRON_SECRET not configured', status: 500 };
  if (token !== secret) return { error: 'Unauthorized', status: 401 };
  return null;
}

// ─── Step Order + Definitions ────────────────────────────────────────────────

const WORKFLOW_STEPS = [
  'research',
  'outline',
  'draft',
  'edit',
  'seo_review',
  'images',
  'schedule',
  'publish',
  'promote',
];

const STEP_DEFAULTS = {
  research:    { days_before: 14, agent_type: 'content_writer' },
  outline:     { days_before: 10, agent_type: 'content_writer' },
  draft:       { days_before:  7, agent_type: 'content_writer' },
  edit:        { days_before:  4, agent_type: 'editor' },
  seo_review:  { days_before:  3, agent_type: 'seo_strategist' },
  images:      { days_before:  2, agent_type: 'visual_artist' },
  schedule:    { days_before:  1, agent_type: 'content_manager' },
  publish:     { days_before:  0, agent_type: 'content_manager' },
  promote:     { days_before: -1, agent_type: 'social_media_manager' },
};

// ─── GET: Get workflow state for a calendar item ─────────────────────────────

export async function GET(req) {
  const auth = await authenticate(req);
  if (auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const calendarId = searchParams.get('calendarId');
  const step = searchParams.get('step');
  const brief = searchParams.get('brief') === '1';

  if (!calendarId) {
    // Return all active (non-published) calendar items with workflow
    const { rows } = await pool.query(`
      SELECT
        cc.id, cc.title, cc.target_keyword, cc.target_url_slug,
        cc.status as calendar_status, cc.publish_date, cc.week_number,
        cc.month_number, cc.priority, cc.notes,
        bp.id as post_id, bp.status as post_status,
        COALESCE(
          (SELECT jsonb_agg(
            jsonb_build_object(
              'id', pw.id,
              'step_name', pw.step_name,
              'status', pw.status,
              'assigned_to', pw.assigned_to,
              'due_date', pw.due_date,
              'completed_at', pw.completed_at,
              'notes', pw.notes
            ) ORDER BY ARRAY_POSITION(ARRAY[
              'research','outline','draft','edit','seo_review',
              'images','schedule','publish','promote'
            ], pw.step_name)
          ) FROM publishing_workflow pw WHERE pw.calendar_id = cc.id),
          '[]'::jsonb
        ) as workflow_steps
      FROM content_calendar cc
      LEFT JOIN blog_posts bp ON cc.post_id = bp.id
      WHERE cc.status != 'published'
      ORDER BY cc.publish_date ASC
    `);
    return NextResponse.json({ success: true, items: rows });
  }

  // Single calendar item
  const { rows } = await pool.query(`
    SELECT
      cc.*,
      bp.id as post_id, bp.title as post_title, bp.slug as post_slug,
      bp.status as post_status, bp.published_at,
      bp.content as post_content, bp.excerpt as post_excerpt,
      bp.featured_image, bp.meta_title, bp.meta_description, bp.tags,
      cb.id as brief_id, cb.outline, cb.key_points, cb.cta_strategy,
      cb.competitor_analysis, cb.target_word_count,
      COALESCE(
        (SELECT jsonb_agg(
          jsonb_build_object(
            'id', pw.id,
            'step_name', pw.step_name,
            'status', pw.status,
            'assigned_to', pw.assigned_to,
            'due_date', pw.due_date,
            'completed_at', pw.completed_at,
            'notes', pw.notes
          ) ORDER BY ARRAY_POSITION(ARRAY[
            'research','outline','draft','edit','seo_review',
            'images','schedule','publish','promote'
          ], pw.step_name)
        ) FROM publishing_workflow pw WHERE pw.calendar_id = cc.id),
        '[]'::jsonb
      ) as workflow_steps
    FROM content_calendar cc
    LEFT JOIN blog_posts bp ON cc.post_id = bp.id
    LEFT JOIN content_briefs cb ON cb.calendar_id = cc.id
    WHERE cc.id = $1
  `, [calendarId]);

  if (!rows.length) {
    return NextResponse.json({ error: 'Calendar item not found' }, { status: 404 });
  }

  const item = rows[0];
  const steps = item.workflow_steps || [];
  const currentStepIndex = steps.findIndex(
    s => s.status === 'pending' || s.status === 'in_progress'
  );
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
  const nextStep = currentStepIndex >= 0 ? steps[currentStepIndex + 1] : null;

  // If brief requested, return content brief data
  if (brief && item.brief_id) {
    const { rows: briefRows } = await pool.query(
      'SELECT * FROM content_briefs WHERE id = $1',
      [item.brief_id]
    );
    return NextResponse.json({
      success: true,
      item,
      brief: briefRows[0] || null,
      current_step: currentStep,
      next_step: nextStep,
      workflow_steps: steps,
    });
  }

  return NextResponse.json({
    success: true,
    item,
    current_step: currentStep,
    next_step: nextStep,
    workflow_steps: steps,
  });
}

// ─── POST: Claim a step / submit step output ────────────────────────────────

export async function POST(req) {
  const auth = await authenticate(req);
  if (auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const {
    calendarId,
    step,
    action,           // 'begin' | 'complete' | 'release'
    agentId,
    agentType,
    // Step-specific content
    content,          // draft/edit full HTML
    excerpt,
    metaTitle,
    metaDescription,
    tags,
    featuredImage,
    scheduledAt,
    socialCopy,      // { x, pinterest, instagram }
    notes,
    // Research + outline fields
    targetKeyword,
    secondaryKeywords,
    searchIntent,
    targetWordCount,
    outline,         // JSON array of { h2, points: [] }
    keyPoints,
    ctaStrategy,
  } = body;

  if (!calendarId || !step) {
    return NextResponse.json(
      { error: 'calendarId and step are required' },
      { status: 400 }
    );
  }

  if (!WORKFLOW_STEPS.includes(step)) {
    return NextResponse.json(
      { error: `Invalid step. Must be one of: ${WORKFLOW_STEPS.join(', ')}` },
      { status: 400 }
    );
  }

  // Get current workflow step record
  const { rows: stepRows } = await pool.query(
    'SELECT * FROM publishing_workflow WHERE calendar_id = $1 AND step_name = $2',
    [calendarId, step]
  );
  if (!stepRows.length) {
    return NextResponse.json({ error: 'Workflow step not found' }, { status: 404 });
  }
  const stepRecord = stepRows[0];

  // Get calendar + post info
  const { rows: calRows } = await pool.query(
    'SELECT * FROM content_calendar WHERE id = $1',
    [calendarId]
  );
  if (!calRows.length) {
    return NextResponse.json({ error: 'Calendar item not found' }, { status: 404 });
  }
  const calendar = calRows[0];

  const now = new Date();
  const result = { success: true, step: stepRecord, calendar };

  // ── BEGIN a step ───────────────────────────────────────────────────────────
  if (action === 'begin') {
    // Only allow beginning if step is pending
    if (stepRecord.status !== 'pending') {
      return NextResponse.json({
        error: `Step '${step}' is ${stepRecord.status}, cannot begin`,
        current_status: stepRecord.status,
      }, { status: 409 });
    }

    await pool.query(`
      UPDATE publishing_workflow
      SET status = 'in_progress', assigned_to = $1, updated_at = NOW()
      WHERE id = $2
    `, [agentId || agentType || 'agent', stepRecord.id]);

    // Update calendar status to 'in_progress' if it was 'planned'
    if (calendar.status === 'planned') {
      await pool.query(
        "UPDATE content_calendar SET status = 'writing', updated_at = NOW() WHERE id = $1",
        [calendarId]
      );
    }

    return NextResponse.json({
      success: true,
      message: `Step '${step}' started`,
      calendar_id: calendarId,
      step_name: step,
      calendar,
      brief: await getBrief(pool, calendarId),
    });
  }

  // ── RELEASE a step ────────────────────────────────────────────────────────
  if (action === 'release') {
    await pool.query(`
      UPDATE publishing_workflow
      SET status = 'pending', assigned_to = NULL, updated_at = NOW()
      WHERE id = $1
    `, [stepRecord.id]);
    return NextResponse.json({ success: true, message: `Step '${step}' released` });
  }

  // ── COMPLETE a step ───────────────────────────────────────────────────────
  if (action === 'complete') {
    // Validate required content for each step
    const validation = validateStepOutput(step, { content, excerpt, metaTitle, outline });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Complete the workflow step
    await pool.query(`
      UPDATE publishing_workflow
      SET status = 'completed', completed_at = NOW(), assigned_to = COALESCE($1, assigned_to),
          notes = COALESCE($2, notes), updated_at = NOW()
      WHERE id = $3
    `, [agentId || agentType, notes, stepRecord.id]);

    // Advance the calendar + produce content based on step
    await advanceWorkflow(pool, calendar, step, {
      content, excerpt, metaTitle, metaDescription, tags, featuredImage,
      scheduledAt, socialCopy, targetKeyword, secondaryKeywords, searchIntent,
      targetWordCount, outline, keyPoints, ctaStrategy,
    });

    // Determine next step
    const stepIndex = WORKFLOW_STEPS.indexOf(step);
    const nextStepName = WORKFLOW_STEPS[stepIndex + 1];

    if (nextStepName) {
      const { rows: nextRows } = await pool.query(
        'SELECT * FROM publishing_workflow WHERE calendar_id = $1 AND step_name = $2',
        [calendarId, nextStepName]
      );
      if (nextRows.length && nextRows[0].status === 'pending') {
        await pool.query(
          "UPDATE publishing_workflow SET status = 'pending' WHERE id = $1",
          [nextRows[0].id]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Step '${step}' completed`,
      calendar_id: calendarId,
      step_name: step,
      next_step: nextStepName || 'pipeline_complete',
    });
  }

  return NextResponse.json({ error: 'Invalid action. Use begin, complete, or release.' }, { status: 400 });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getBrief(pool, calendarId) {
  const { rows } = await pool.query(
    'SELECT * FROM content_briefs WHERE calendar_id = $1',
    [calendarId]
  );
  return rows[0] || null;
}

function validateStepOutput(step, data) {
  switch (step) {
    case 'research':
      if (!data.targetKeyword) return { valid: false, error: 'targetKeyword required for research step' };
      return { valid: true };
    case 'outline':
      if (!data.outline) return { valid: false, error: 'outline (JSON) required for outline step' };
      return { valid: true };
    case 'draft':
      if (!data.content) return { valid: false, error: 'content (HTML) required for draft step' };
      return { valid: true };
    case 'edit':
      if (!data.content) return { valid: false, error: 'content (HTML) required for edit step' };
      return { valid: true };
    case 'seo_review':
      if (!data.metaTitle) return { valid: false, error: 'metaTitle and metaDescription required for seo_review' };
      return { valid: true };
    case 'images':
      if (!data.featuredImage) return { valid: false, error: 'featuredImage URL required for images step' };
      return { valid: true };
    case 'schedule':
      // scheduledAt is required to schedule
      return { valid: true };
    case 'publish':
      return { valid: true };
    case 'promote':
      return { valid: true }; // social copy can be submitted or marked manual
    default:
      return { valid: true };
  }
}

async function advanceWorkflow(pool, calendar, step, data) {
  const calendarId = calendar.id;

  switch (step) {
    // ── RESEARCH: Create or update content brief ──────────────────────────────
    case 'research': {
      await pool.query(`
        INSERT INTO content_briefs
        (calendar_id, target_keyword, secondary_keywords, search_intent,
         target_word_count, key_points, cta_strategy, outline)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (calendar_id) DO UPDATE SET
          target_keyword = EXCLUDED.target_keyword,
          secondary_keywords = EXCLUDED.secondary_keywords,
          search_intent = EXCLUDED.search_intent,
          target_word_count = EXCLUDED.target_word_count,
          key_points = EXCLUDED.key_points,
          cta_strategy = EXCLUDED.cta_strategy,
          outline = EXCLUDED.outline,
          updated_at = NOW()
      `, [
        calendarId,
        data.targetKeyword || calendar.target_keyword,
        data.secondaryKeywords || [],
        data.searchIntent || 'informational',
        data.targetWordCount || 1500,
        data.keyPoints || [],
        data.ctaStrategy || 'Link to free tool. Email signup CTA.',
        data.outline ? JSON.stringify(data.outline) : null,
      ]);
      break;
    }

    // ── OUTLINE: Update content brief with outline ─────────────────────────────
    case 'outline': {
      if (data.outline) {
        await pool.query(`
          UPDATE content_briefs SET outline = $1, updated_at = NOW()
          WHERE calendar_id = $2
        `, [JSON.stringify(data.outline), calendarId]);
      }
      // Create a draft blog post placeholder
      const slug = calendar.target_url_slug ||
        (calendar.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      await pool.query(`
        INSERT INTO blog_posts (title, slug, excerpt, content, status, category, tags, meta_title, meta_description)
        SELECT $1, $2, $3, $4, 'draft',
               (SELECT category FROM content_briefs WHERE calendar_id = $5 LIMIT 1),
               ARRAY[COALESCE($6, (SELECT target_keyword FROM content_briefs WHERE calendar_id = $5 LIMIT 1))],
               $1, $3
        WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = $2)
      `, [
        calendar.title,
        slug,
        calendar.notes || '',
        '',  // no content yet
        calendarId,
        calendar.target_keyword,
      ]);
      // Link post to calendar
      const { rows: postRows } = await pool.query(
        'SELECT id FROM blog_posts WHERE slug = $1 LIMIT 1',
        [slug]
      );
      if (postRows.length) {
        await pool.query(
          'UPDATE content_calendar SET post_id = $1 WHERE id = $2',
          [postRows[0].id, calendarId]
        );
      }
      break;
    }

    // ── DRAFT: Fill in blog post content ─────────────────────────────────────
    case 'draft': {
      const slug = calendar.target_url_slug ||
        (calendar.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      await pool.query(`
        UPDATE blog_posts SET
          content = COALESCE($1, content),
          excerpt = COALESCE($2, excerpt),
          updated_at = NOW()
        WHERE id = (SELECT post_id FROM content_calendar WHERE id = $3)
           OR slug = $4
      `, [data.content, data.excerpt, calendarId, slug]);
      break;
    }

    // ── EDIT: Finalize content ────────────────────────────────────────────────
    case 'edit': {
      await pool.query(`
        UPDATE blog_posts SET
          content = COALESCE($1, content),
          excerpt = COALESCE($2, excerpt),
          status = 'review',
          updated_at = NOW()
        WHERE id = (SELECT post_id FROM content_calendar WHERE id = $3)
      `, [data.content, data.excerpt, calendarId]);
      break;
    }

    // ── SEO REVIEW: Add meta fields ───────────────────────────────────────────
    case 'seo_review': {
      await pool.query(`
        UPDATE blog_posts SET
          meta_title = COALESCE($1, meta_title),
          meta_description = COALESCE($2, meta_description),
          tags = COALESCE($3, tags),
          updated_at = NOW()
        WHERE id = (SELECT post_id FROM content_calendar WHERE id = $4)
      `, [data.metaTitle, data.metaDescription, data.tags, calendarId]);
      break;
    }

    // ── IMAGES: Add featured image ─────────────────────────────────────────────
    case 'images': {
      await pool.query(`
        UPDATE blog_posts SET
          featured_image = COALESCE($1, featured_image),
          updated_at = NOW()
        WHERE id = (SELECT post_id FROM content_calendar WHERE id = $2)
      `, [data.featuredImage, calendarId]);
      break;
    }

    // ── SCHEDULE: Set publish date ─────────────────────────────────────────────
    case 'schedule': {
      const publishDate = data.scheduledAt || calendar.publish_date;
      await pool.query(`
        UPDATE blog_posts SET
          status = 'scheduled',
          published_at = $1,
          updated_at = NOW()
        WHERE id = (SELECT post_id FROM content_calendar WHERE id = $2)
      `, [publishDate, calendarId]);
      await pool.query(
        "UPDATE content_calendar SET status = 'scheduled' WHERE id = $1",
        [calendarId]
      );
      break;
    }

    // ── PUBLISH: Set status to published ──────────────────────────────────────
    case 'publish': {
      await pool.query(`
        UPDATE blog_posts SET
          status = 'published',
          published_at = COALESCE(published_at, NOW()),
          updated_at = NOW()
        WHERE id = (SELECT post_id FROM content_calendar WHERE id = $1)
      `, [calendarId]);
      await pool.query(
        "UPDATE content_calendar SET status = 'published' WHERE id = $1",
        [calendarId]
      );
      break;
    }

    // ── PROMOTE: Store social copy ────────────────────────────────────────────
    case 'promote': {
      // Store social copy in a social_posts table (create if not exists)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS social_posts (
          id SERIAL PRIMARY KEY,
          calendar_id INTEGER REFERENCES content_calendar(id) ON DELETE SET NULL,
          post_id INTEGER REFERENCES blog_posts(id) ON DELETE SET NULL,
          platform VARCHAR(50),  -- x, pinterest, instagram
          content TEXT,
          status VARCHAR(20) DEFAULT 'draft',  -- draft, published, manual
          posted_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      if (data.socialCopy) {
        for (const [platform, content] of Object.entries(data.socialCopy)) {
          if (!content) continue;
          await pool.query(`
            INSERT INTO social_posts (calendar_id, post_id, platform, content, status)
            VALUES ($1, (SELECT post_id FROM content_calendar WHERE id = $1), $2, $3, 'manual')
            ON CONFLICT DO NOTHING
          `, [calendarId, platform, content]);
        }
      }
      await pool.query(
        "UPDATE content_calendar SET status = 'promoted' WHERE id = $1",
        [calendarId]
      );
      break;
    }
  }
}
