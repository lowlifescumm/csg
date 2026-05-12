import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pool } from '@/lib/db.js';
import { authOptions } from '@/lib/auth-config';
import { getAuthenticatedUser } from '@/lib/auth';
import { getForecastPreferences } from '@/lib/forecast-engine.js';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);

    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prefs = await getForecastPreferences(authResult.userId);
    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    logger.error('Error fetching forecast preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences', details: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  try {
    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);

    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      delivery_cadence,
      delivery_time,
      timezone,
      tone,
      default_length,
      topics,
      include_actions,
      include_rituals,
      ai_rewrite_enabled,
      email_enabled,
      push_enabled,
    } = body;

    const fields = [];
    const values = [authResult.userId];
    let paramCount = 1;

    const addField = (name, value) => {
      if (value !== undefined && value !== null) {
        paramCount += 1;
        fields.push(`${name} = $${paramCount}`);
        values.push(value);
      }
    };

    addField('delivery_cadence', delivery_cadence);
    addField('delivery_time', delivery_time);
    addField('timezone', timezone);
    addField('tone', tone);
    addField('default_length', default_length);
    addField('topics', topics);
    addField('include_actions', include_actions);
    addField('include_rituals', include_rituals);
    addField('ai_rewrite_enabled', ai_rewrite_enabled);
    addField('email_enabled', email_enabled);
    addField('push_enabled', push_enabled);

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');

    const result = await pool.query(
      `INSERT INTO forecast_preferences (user_id)
       VALUES ($1)
       ON CONFLICT (user_id)
       DO UPDATE SET ${fields.join(', ')}
       RETURNING *`,
      values,
    );

    return NextResponse.json({
      success: true,
      preferences: result.rows[0],
    });
  } catch (error) {
    logger.error('Error updating forecast preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences', details: error.message },
      { status: 500 },
    );
  }
}


