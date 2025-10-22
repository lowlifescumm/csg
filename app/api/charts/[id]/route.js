/**
 * Individual Natal Chart API
 * GET /api/charts/[id] - Get a specific natal chart
 * PUT /api/charts/[id] - Update a natal chart
 * DELETE /api/charts/[id] - Delete a natal chart
 */

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { pool } from '@/lib/db.js';

/**
 * GET /api/charts/[id]
 * Retrieve a specific natal chart by ID
 */
export async function GET(req, { params }) {
  try {
    // Authenticate user
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { id } = params;

    // Get the natal chart
    const { rows } = await pool.query(
      `SELECT 
        id, user_id, birth_date, birth_time, timezone, latitude, longitude,
        location_name, natal_positions, houses, ascendant, midheaven,
        chart_name, is_primary, created_at, updated_at
       FROM natal_charts
       WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Natal chart not found' }, { status: 404 });
    }

    const chart = rows[0];

    // Verify ownership
    if (chart.user_id !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Format response
    const chartData = {
      id: chart.id,
      chartName: chart.chart_name,
      isPrimary: chart.is_primary,
      birthInfo: {
        date: chart.birth_date,
        time: chart.birth_time,
        timezone: chart.timezone,
        location: {
          name: chart.location_name,
          latitude: chart.latitude,
          longitude: chart.longitude
        }
      },
      chartData: {
        planets: chart.natal_positions,
        houses: chart.houses,
        ascendant: chart.ascendant,
        midheaven: chart.midheaven
      },
      createdAt: chart.created_at,
      updatedAt: chart.updated_at
    };

    // Get associated transits count
    const { rows: transitRows } = await pool.query(
      `SELECT COUNT(*) as count FROM transits 
       WHERE natal_chart_id = $1 AND status IN ('upcoming', 'active')`,
      [id]
    );

    return NextResponse.json({
      success: true,
      chart: chartData,
      transitCount: parseInt(transitRows[0].count)
    });

  } catch (error) {
    console.error('Error fetching natal chart:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({
      error: 'Failed to fetch natal chart',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * PUT /api/charts/[id]
 * Update a natal chart (limited to metadata only, not birth data)
 */
export async function PUT(req, { params }) {
  try {
    // Authenticate user
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { id } = params;

    // Verify ownership
    const { rows: chartRows } = await pool.query(
      'SELECT user_id FROM natal_charts WHERE id = $1',
      [id]
    );

    if (chartRows.length === 0) {
      return NextResponse.json({ error: 'Natal chart not found' }, { status: 404 });
    }

    if (chartRows[0].user_id !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse update data
    const body = await req.json();
    const { chartName, isPrimary } = body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (chartName !== undefined) {
      updates.push(`chart_name = $${paramCount++}`);
      values.push(chartName);
    }

    if (isPrimary !== undefined) {
      // If setting as primary, unset other primary charts
      if (isPrimary) {
        await pool.query(
          'UPDATE natal_charts SET is_primary = false WHERE user_id = $1 AND is_primary = true AND id != $2',
          [userId, id]
        );
      }
      updates.push(`is_primary = $${paramCount++}`);
      values.push(isPrimary);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`);

    // Add chart ID to values
    values.push(id);

    // Execute update
    const { rows } = await pool.query(
      `UPDATE natal_charts 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, chart_name, is_primary, updated_at`,
      values
    );

    return NextResponse.json({
      success: true,
      chart: rows[0],
      message: 'Natal chart updated successfully'
    });

  } catch (error) {
    console.error('Error updating natal chart:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({
      error: 'Failed to update natal chart',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * DELETE /api/charts/[id]
 * Delete a natal chart and all associated transits
 */
export async function DELETE(req, { params }) {
  try {
    // Authenticate user
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { id } = params;

    // Verify ownership
    const { rows: chartRows } = await pool.query(
      'SELECT user_id FROM natal_charts WHERE id = $1',
      [id]
    );

    if (chartRows.length === 0) {
      return NextResponse.json({ error: 'Natal chart not found' }, { status: 404 });
    }

    if (chartRows[0].user_id !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete chart (cascade will delete associated transits and subscriptions)
    await pool.query('DELETE FROM natal_charts WHERE id = $1', [id]);

    return NextResponse.json({
      success: true,
      message: 'Natal chart and associated data deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting natal chart:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({
      error: 'Failed to delete natal chart',
      details: error.message
    }, { status: 500 });
  }
}


