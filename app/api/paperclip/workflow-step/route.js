/**
 * PATCH /api/paperclip/workflow-step
 *
 * Update a workflow step status — used by Paperclip agents to mark
 * content pipeline progress on the calendar dashboard.
 *
 * Security: x-api-key header (PAPERCLIP_API_KEY env var)
 */

import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

const API_KEY = process.env.PAPERCLIP_API_KEY || 'csg-content-pipeline-2026-secure-key';

function authCheck(request) {
  const key = request.headers.get('x-api-key');
  return key === API_KEY;
}

export async function PATCH(request) {
  try {
    if (!authCheck(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { calendarId, stepName, status } = body;

    if (!calendarId || !stepName || !status) {
      return NextResponse.json(
        { error: 'calendarId, stepName, and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'blocked'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Update the workflow step
    const result = await pool.query(`
      UPDATE publishing_workflow
      SET status = $1,
          completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE NULL END
      WHERE calendar_id = $2 AND step_name = $3
      RETURNING *
    `, [status, calendarId, stepName]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: `Workflow step '${stepName}' not found for calendar ${calendarId}` },
        { status: 404 }
      );
    }

    // Auto-update calendar status based on step progress
    const allSteps = await pool.query(`
      SELECT status FROM publishing_workflow WHERE calendar_id = $1
    `, [calendarId]);

    const statuses = allSteps.rows.map(r => r.status);
    let calendarStatus = 'planned';
    if (statuses.every(s => s === 'completed')) {
      calendarStatus = 'ready';
    } else if (statuses.some(s => s === 'in_progress')) {
      calendarStatus = 'writing';
    } else if (statuses.some(s => s === 'completed')) {
      calendarStatus = 'in_progress';
    }

    await pool.query(`
      UPDATE content_calendar SET status = $1, updated_at = NOW() WHERE id = $2
    `, [calendarStatus, calendarId]);

    return NextResponse.json({
      success: true,
      step: result.rows[0],
      calendarStatus
    });

  } catch (error) {
    console.error('workflow-step PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    if (!authCheck(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('calendarId');

    if (!calendarId) {
      return NextResponse.json({ error: 'calendarId is required' }, { status: 400 });
    }

    const result = await pool.query(`
      SELECT step_name, status, due_date, completed_at
      FROM publishing_workflow
      WHERE calendar_id = $1
      ORDER BY id ASC
    `, [calendarId]);

    return NextResponse.json({ success: true, steps: result.rows });

  } catch (error) {
    console.error('workflow-step GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
