import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { pool } from '@/lib/db.js';
import { getForecastPreferences } from '@/lib/forecast-engine.js';

/**
 * GET /api/forecasts/preferences
 * Get user's forecast preferences
 */
export async function GET(req) {
  try {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const prefs = await getForecastPreferences(userId);

    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch preferences',
      details: error.message,
    }, { status: 500 });
  }
}

/**
 * PUT /api/forecasts/preferences
 * Update user's forecast preferences
 */
export async function PUT(req) {
  try {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

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

    // Build update query
    const fields = [];
    const values = [userId];
    let paramCount = 1;

    const addField = (name, value) => {
      if (value !== undefined && value !== null) {
        paramCount++;
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
      values
    );

    return NextResponse.json({
      success: true,
      preferences: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ 
      error: 'Failed to update preferences',
      details: error.message,
    }, { status: 500 });
  }
}

