const logger = require('../../../../lib/logger');
/**
 * PATCH /api/paperclip/workflow-step
 * Update a workflow step in the content_calendar JSONB column.
 * Pattern: read -> modify in JS -> write back. Works with any JSON structure.
 */
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

const API_KEY = process.env.PAPERCLIP_API_KEY || 'csg-content-pipeline-2026-secure-key';

function authCheck(request) {
  return request.headers.get('x-api-key') === API_KEY;
}

export async function PATCH(request) {
  try {
    if (!authCheck(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { calendarId, stepName, status } = await request.json();

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

    // Fetch the current calendar entry
    const current = await pool.query(
      `SELECT id, title, status as calendar_status, workflow_steps
       FROM content_calendar WHERE id = $1`,
      [calendarId]
    );

    if (current.rows.length === 0) {
      return NextResponse.json(
        { error: `Calendar entry ${calendarId} not found` },
        { status: 404 }
      );
    }

    const row = current.rows[0];
    let steps = row.workflow_steps;

    // Handle both JSON array and potentially null/missing
    if (!steps || !Array.isArray(steps)) {
      steps = [];
    }

    // Find and update the matching step
    let found = false;
    const now = new Date().toISOString();
    steps = steps.map(step => {
      if (step.step_name === stepName) {
        found = true;
        return {
          ...step,
          status,
          completed_at: status === 'completed' ? now : null
        };
      }
      return step;
    });

    if (!found) {
      return NextResponse.json(
        { error: `Step '${stepName}' not found in calendar entry ${calendarId}` },
        { status: 404 }
      );
    }

    // Compute new calendar status
    const allStatuses = steps.map(s => s.status);
    let calendarStatus = 'planned';
    if (allStatuses.every(s => s === 'completed')) {
      calendarStatus = 'ready';
    } else if (allStatuses.some(s => s === 'in_progress')) {
      calendarStatus = 'writing';
    } else if (allStatuses.some(s => s === 'completed')) {
      calendarStatus = 'in_progress';
    }

    // Update with new steps and optionally new calendar status
    await pool.query(`
      UPDATE content_calendar
      SET workflow_steps = $1,
          status = CASE WHEN $2 != status THEN $2 ELSE status END,
          updated_at = NOW()
      WHERE id = $3
    `, [JSON.stringify(steps), calendarStatus, calendarId]);

    return NextResponse.json({
      success: true,
      calendarId,
      stepName,
      status,
      calendarStatus,
      completedAt: status === 'completed' ? now : null,
      stepsUpdated: 1
    });

  } catch (error) {
    logger.error('workflow-step PATCH error:', error);
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

    return NextResponse.json({ success: true, calendar: result.rows[0] });
  } catch (error) {
    logger.error('workflow-step GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
