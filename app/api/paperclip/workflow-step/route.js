/**
 * PATCH /api/paperclip/workflow-step
 *
 * Update a workflow step status in the content_calendar JSONB column.
 * Used by Paperclip agents to mark pipeline progress on the calendar dashboard.
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

    // Build completed_at timestamp if completing
    const completedAt = status === 'completed'
      ? new Date().toISOString()
      : null;

    // Update the step within the JSONB workflow_steps array
    const result = await pool.query(`
      UPDATE content_calendar
      SET workflow_steps = workflow_steps #=
        jsonb_build_array(
          COALESCE(
            (
              SELECT jsonb_agg(
                CASE
                  WHEN (value->>'step_name') = $2 THEN
                    value ||
                      jsonb_build_object(
                        'status', $1,
                        'completed_at',
                          CASE WHEN $1 = 'completed' THEN NOW()::text ELSE NULL END
                      )
                  ELSE value
                END
              )
              FROM jsonb_array_elements(workflow_steps)
            ),
            '[]'::jsonb
          )
        ),
        updated_at = NOW()
      WHERE id = $3
      RETURNING id, title, status as calendar_status, workflow_steps
    `, [status, stepName, calendarId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: `Calendar entry ${calendarId} not found` },
        { status: 404 }
      );
    }

    const updatedSteps = result.rows[0].workflow_steps;
    const allStatuses = updatedSteps.map(s => s.status);

    // Auto-update calendar status based on step progress
    let calendarStatus = 'planned';
    if (allStatuses.every(s => s === 'completed')) {
      calendarStatus = 'ready';
    } else if (allStatuses.some(s => s === 'in_progress')) {
      calendarStatus = 'writing';
    } else if (allStatuses.some(s => s === 'completed')) {
      calendarStatus = 'in_progress';
    }

    // Update calendar status if it changed
    if (calendarStatus !== result.rows[0].calendar_status) {
      await pool.query(
        `UPDATE content_calendar SET status = $1, updated_at = NOW() WHERE id = $2`,
        [calendarStatus, calendarId]
      );
    }

    return NextResponse.json({
      success: true,
      calendarId,
      stepName,
      status,
      completedAt,
      calendarStatus,
      stepsUpdated: 1
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
      SELECT id, title, status, workflow_steps
      FROM content_calendar
      WHERE id = $1
    `, [calendarId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Calendar entry not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      calendar: result.rows[0]
    });

  } catch (error) {
    console.error('workflow-step GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
