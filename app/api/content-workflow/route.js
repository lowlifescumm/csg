import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

/**
 * POST /api/content-workflow
 *
 * Receives step completion payloads from the Hermes pipeline supervisor.
 * Updates the content_workflow table and associated blog_posts record.
 *
 * Request body:
 * {
 *   calendarId: string,     // source-of-truth ID from content-calendar
 *   step:       string,     // research | outline | draft | edit | seo_review | images | schedule | publish | promote
 *   action:     string,    // complete | skip | fail
 *   content?:   string,     // research notes, outline JSON, draft HTML, edited HTML
 *   metaTitle?: string,
 *   metaDescription?: string,
 *   featuredImage?: string,
 *   imageAlt?: string,
 *   imageCaption?: string,
 *   scheduledDate?: string, // ISO date string for schedule step
 *   tags?: string[],
 * }
 *
 * The route auto-creates a content_workflow record if none exists for calendarId.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      calendarId,
      step,
      action = 'complete',
      // Step-specific fields
      content,
      targetKeyword,
      metaTitle,
      metaDescription,
      featuredImage,
      imageAlt,
      imageCaption,
      scheduledDate,
      tags,
    } = body;

    // Basic validation
    if (!calendarId || !step) {
      return NextResponse.json(
        { error: 'calendarId and step are required' },
        { status: 400 }
      );
    }

    const validSteps = ['research', 'outline', 'draft', 'edit', 'seo_review', 'images', 'schedule', 'publish', 'promote'];
    if (!validSteps.includes(step)) {
      return NextResponse.json(
        { error: `Invalid step. Must be one of: ${validSteps.join(', ')}` },
        { status: 400 }
      );
    }

    // Upsert content_workflow record
    const upsertWorkflow = `
      INSERT INTO content_workflow (calendar_id, current_step, step_status, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (calendar_id)
      DO UPDATE SET
        current_step  = EXCLUDED.current_step,
        step_status   = EXCLUDED.step_status,
        updated_at    = NOW()
      RETURNING id, blog_post_id, current_step, step_status
    `;
    const { rows: workflowRows } = await pool.query(upsertWorkflow, [
      calendarId,
      step,
      action === 'complete' ? 'completed' : action,
    ]);
    const workflow = workflowRows[0];

    // Per-step field updates on the blog_posts record (if a blog_post_id exists)
    if (workflow.blog_post_id) {
      await updateBlogPost(workflow.blog_post_id, step, body);
    }

    // Store step result as JSON in content_workflow_steps
    await pool.query(`
      INSERT INTO content_workflow_steps (workflow_id, step_name, step_status, step_data, completed_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (workflow_id, step_name)
      DO UPDATE SET
        step_status = EXCLUDED.step_status,
        step_data   = EXCLUDED.step_data,
        completed_at = NOW()
    `, [
      workflow.id,
      step,
      action === 'complete' ? 'completed' : action,
      JSON.stringify({
        content:          content || null,
        targetKeyword:   targetKeyword || null,
        metaTitle:       metaTitle || null,
        metaDescription: metaDescription || null,
        featuredImage:   featuredImage || null,
        imageAlt:        imageAlt || null,
        imageCaption:   imageCaption || null,
        scheduledDate:   scheduledDate || null,
        tags:            tags || null,
      }),
    ]);

    return NextResponse.json({
      success: true,
      workflowId:    workflow.id,
      blogPostId:   workflow.blog_post_id,
      step,
      action,
      message:       `Step '${step}' ${action === 'complete' ? 'completed' : action} for calendar=${calendarId}`,
    }, { status: 200 });

  } catch (error) {
    console.error('[/api/content-workflow] Error:', error.message);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/content-workflow?calendarId=xxx
 *
 * Returns the current workflow state for a given calendarId.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('calendarId');

    if (!calendarId) {
      return NextResponse.json({ error: 'calendarId query param is required' }, { status: 400 });
    }

    const { rows } = await pool.query(`
      SELECT
        w.id, w.calendar_id, w.blog_post_id, w.current_step, w.step_status, w.created_at, w.updated_at,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'step', step_name, 'status', step_status, 'data', step_data, 'completedAt', completed_at
          ) ORDER BY completed_at)
          FROM content_workflow_steps s WHERE s.workflow_id = w.id),
          '[]'
        ) as steps
      FROM content_workflow w
      WHERE w.calendar_id = $1
    `, [calendarId]);

    if (!rows.length) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    console.error('[/api/content-workflow GET] Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function updateBlogPost(blogPostId, step, body) {
  const { content, metaTitle, metaDescription, featuredImage, imageAlt, scheduledDate, tags } = body;

  const updates = [];
  const values  = [];
  let   param   = 1;

  if (step === 'draft' && content) {
    updates.push(`content = $${param++}`);
    values.push(content);
  }
  if (step === 'edit' && content) {
    updates.push(`content = $${param++}`);
    values.push(content);
  }
  if (step === 'seo_review') {
    if (metaTitle)       { updates.push(`meta_title = $${param++}`);       values.push(metaTitle); }
    if (metaDescription){ updates.push(`meta_description = $${param++}`); values.push(metaDescription); }
  }
  if (step === 'images' && featuredImage) {
    updates.push(`featured_image = $${param++}`);
    values.push(featuredImage);
  }
  if (step === 'schedule' && scheduledDate) {
    updates.push(`published_at = $${param++}`);
    values.push(scheduledDate);
    updates.push(`status = 'draft'`);
  }
  if (step === 'publish') {
    updates.push(`status = 'published'`);
    updates.push(`published_at = COALESCE(published_at, NOW())`);
  }
  if (tags && Array.isArray(tags) && tags.length) {
    updates.push(`tags = $${param++}`);
    values.push(tags);
  }

  if (!updates.length) return;

  values.push(blogPostId);
  await pool.query(
    `UPDATE blog_posts SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${param}`,
    values
  );
}
