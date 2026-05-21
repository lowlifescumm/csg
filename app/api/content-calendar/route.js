import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/content-calendar
 * Get content calendar with optional filters
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const month = searchParams.get('month');
    const week = searchParams.get('week');
    const upcoming = searchParams.get('upcoming');

    let whereClause = '';
    let queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereClause = `WHERE status = $${paramCount}`;
      queryParams.push(status);
    }

    if (month) {
      paramCount++;
      whereClause += whereClause ? ` AND month_number = $${paramCount}` : `WHERE month_number = $${paramCount}`;
      queryParams.push(parseInt(month));
    }

    if (week) {
      paramCount++;
      whereClause += whereClause ? ` AND week_number = $${paramCount}` : `WHERE week_number = $${paramCount}`;
      queryParams.push(parseInt(week));
    }

    if (upcoming === 'true') {
      paramCount++;
      whereClause += whereClause ? ` AND publish_date >= $${paramCount}` : `WHERE publish_date >= $${paramCount}`;
      queryParams.push(new Date().toISOString().split('T')[0]);
    }

    // Get calendar items
    const query = `
      SELECT 
        cc.*,
        bp.id as actual_post_id,
        bp.status as post_status,
        bp.published_at,
        COALESCE(
          (SELECT jsonb_agg(
            jsonb_build_object(
              'step_name', pw.step_name,
              'status', pw.status,
              'due_date', pw.due_date,
              'completed_at', pw.completed_at
            )
          ) FROM publishing_workflow pw WHERE pw.calendar_id = cc.id),
          '[]'::jsonb
        ) as workflow_steps
      FROM content_calendar cc
      LEFT JOIN blog_posts bp ON cc.post_id = bp.id
      ${whereClause}
      ORDER BY cc.publish_date ASC, cc.week_number ASC
    `;

    const { rows } = await pool.query(query, queryParams);

    return NextResponse.json({
      success: true,
      calendar: rows,
      count: rows.length
    });

  } catch (error) {
    logger.error('Content calendar API error:', error);
    return NextResponse.json({ error: 'Failed to fetch content calendar' }, { status: 500 });
  }
}

/**
 * POST /api/content-calendar
 * Create or update a calendar entry
 */
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { rows: userRows } = await pool.query(
      "SELECT role FROM users WHERE id=$1",
      [decoded.userId]
    );
    
    if (!userRows[0] || userRows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id, // if provided, update existing
      title,
      target_keyword,
      target_url_slug,
      content_type = 'blog_post',
      status = 'planned',
      priority = 'medium',
      publish_date,
      week_number,
      month_number,
      notes,
      post_id
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (id) {
      // Update existing
      const { rows } = await pool.query(`
        UPDATE content_calendar 
        SET title = $1, target_keyword = $2, target_url_slug = $3, 
            content_type = $4, status = $5, priority = $6, 
            publish_date = $7, week_number = $8, month_number = $9,
            notes = $10, post_id = $11, updated_at = NOW()
        WHERE id = $12
        RETURNING *
      `, [title, target_keyword, target_url_slug, content_type, status, priority,
          publish_date, week_number, month_number, notes, post_id, id]);

      return NextResponse.json({ success: true, calendar: rows[0] });
    } else {
      // Create new
      const { rows } = await pool.query(`
        INSERT INTO content_calendar 
        (title, target_keyword, target_url_slug, content_type, status, priority,
         publish_date, week_number, month_number, notes, post_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [title, target_keyword, target_url_slug, content_type, status, priority,
          publish_date, week_number, month_number, notes, post_id]);

      // Create workflow steps for new item
      const calendarId = rows[0].id;
      const workflowSteps = [
        { step: 'research', days: 14 },
        { step: 'outline', days: 10 },
        { step: 'draft', days: 7 },
        { step: 'edit', days: 4 },
        { step: 'seo_review', days: 3 },
        { step: 'images', days: 2 },
        { step: 'schedule', days: 1 },
        { step: 'publish', days: 0 },
        { step: 'promote', days: -1 }
      ];

      for (const { step, days } of workflowSteps) {
        await pool.query(`
          INSERT INTO publishing_workflow (calendar_id, step_name, due_date, status)
          VALUES ($1, $2, $3, 'pending')
        `, [calendarId, step, publish_date ? new Date(new Date(publish_date).getTime() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null]);
      }

      return NextResponse.json({ success: true, calendar: rows[0] });
    }

  } catch (error) {
    logger.error('Content calendar POST error:', error);
    return NextResponse.json({ error: 'Failed to save calendar entry' }, { status: 500 });
  }
}

/**
 * PATCH /api/content-calendar
 * Update status and workflow
 */
export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { rows: userRows } = await pool.query(
      "SELECT role FROM users WHERE id=$1",
      [decoded.userId]
    );
    
    if (!userRows[0] || userRows[0].role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { calendarId, status, workflowStepId, workflowStatus, notes } = body;

    if (!calendarId) {
      return NextResponse.json({ error: 'Calendar ID is required' }, { status: 400 });
    }

    // Update calendar status if provided
    if (status) {
      await pool.query(
        'UPDATE content_calendar SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, calendarId]
      );
    }

    // Update workflow step if provided
    if (workflowStepId && workflowStatus) {
      await pool.query(`
        UPDATE publishing_workflow 
        SET status = $1, completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END
        WHERE id = $2
      `, [workflowStatus, workflowStepId]);
    }

    // Update notes if provided
    if (notes) {
      await pool.query(
        'UPDATE content_calendar SET notes = $1, updated_at = NOW() WHERE id = $2',
        [notes, calendarId]
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Content calendar PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update calendar' }, { status: 500 });
  }
}
