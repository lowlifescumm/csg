const logger = require('../../../lib/logger');
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pool } from '@/lib/db.js';
import { authOptions } from '@/lib/auth-config';
import { getAuthenticatedUser } from '@/lib/auth';

const VALID_PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const VALID_ASPECTS = ['conjunction', 'opposition', 'trine', 'square', 'sextile', 'quincunx'];

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);

    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rows: userRows } = await pool.query(
      'SELECT role, stripe_subscription_id FROM users WHERE id = $1',
      [authResult.userId],
    );

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userRows[0];
    const isAdmin = user.role === 'admin';
    const isPremium = Boolean(user.stripe_subscription_id);

    if (!isAdmin && !isPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required for transit monitoring', requiresPremium: true },
        { status: 402 },
      );
    }

    const body = await req.json();
    const {
      natalChartId,
      transitingBodies = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'],
      natalPoints = ['Sun', 'Moon', 'Venus', 'Mars'],
      aspects = ['conjunction', 'square', 'opposition', 'trine'],
      minStrength = 50,
      notifyEmail = true,
      notifyPush = false,
      notifyWebhook = false,
      webhookUrl = null,
    } = body;

    if (!natalChartId) {
      return NextResponse.json({ error: 'Natal chart ID is required' }, { status: 400 });
    }

    const { rows: chartRows } = await pool.query(
      'SELECT user_id FROM natal_charts WHERE id = $1',
      [natalChartId],
    );

    if (chartRows.length === 0) {
      return NextResponse.json({ error: 'Natal chart not found' }, { status: 404 });
    }
    if (chartRows[0].user_id !== authResult.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const invalidPlanets = transitingBodies.filter((p) => !VALID_PLANETS.includes(p));
    const invalidNatalPoints = natalPoints.filter((p) => !VALID_PLANETS.includes(p));
    const invalidAspects = aspects.filter((a) => !VALID_ASPECTS.includes(a));

    if (invalidPlanets.length || invalidNatalPoints.length || invalidAspects.length) {
      return NextResponse.json({
        error: 'Invalid configuration',
        invalidPlanets,
        invalidNatalPoints,
        invalidAspects,
        validPlanets: VALID_PLANETS,
        validAspects: VALID_ASPECTS,
      }, { status: 400 });
    }

    if (notifyWebhook && !webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL required when webhook notifications are enabled' }, { status: 400 });
    }
    if (webhookUrl) {
      try {
        new URL(webhookUrl);
      } catch (err) {
        console.error("[subscriptions/transit] Invalid webhook URL:", err);
        return NextResponse.json({ error: 'Invalid webhook URL format' }, { status: 400 });
      }
    }

    const nextCheck = new Date();
    nextCheck.setHours(nextCheck.getHours() + 1);

    const { rows } = await pool.query(
      `INSERT INTO transit_subscriptions (
        user_id, natal_chart_id, transiting_bodies, natal_points, aspects,
        min_strength, notify_email, notify_push, notify_webhook, webhook_url,
        is_active, next_check
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, created_at`,
      [
        authResult.userId,
        natalChartId,
        transitingBodies,
        natalPoints,
        aspects,
        minStrength,
        notifyEmail,
        notifyPush,
        notifyWebhook,
        webhookUrl,
        true,
        nextCheck,
      ],
    );

    return NextResponse.json({
      success: true,
      subscription: {
        id: rows[0].id,
        userId: authResult.userId,
        natalChartId,
        config: {
          transitingBodies,
          natalPoints,
          aspects,
          minStrength,
        },
        notifications: {
          email: notifyEmail,
          push: notifyPush,
          webhook: notifyWebhook,
          webhookUrl: webhookUrl || null,
        },
        isActive: true,
        nextCheck,
        createdAt: rows[0].created_at,
      },
      message: 'Transit monitoring subscription created successfully',
    }, { status: 201 });
  } catch (error) {
    logger.error('Error creating transit subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create transit subscription', details: error.message },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);

    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rows } = await pool.query(
      `SELECT
        ts.*,
        nc.chart_name,
        nc.location_name
       FROM transit_subscriptions ts
       JOIN natal_charts nc ON ts.natal_chart_id = nc.id
       WHERE ts.user_id = $1
       ORDER BY ts.created_at DESC`,
      [authResult.userId],
    );

    const subscriptions = rows.map((row) => ({
      id: row.id,
      natalChartId: row.natal_chart_id,
      chartName: row.chart_name,
      chartLocation: row.location_name,
      config: {
        transitingBodies: row.transiting_bodies,
        natalPoints: row.natal_points,
        aspects: row.aspects,
        minStrength: row.min_strength,
      },
      notifications: {
        email: row.notify_email,
        push: row.notify_push,
        webhook: row.notify_webhook,
        webhookUrl: row.webhook_url,
      },
      isActive: row.is_active,
      lastCheck: row.last_check,
      nextCheck: row.next_check,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ success: true, subscriptions, count: subscriptions.length });
  } catch (error) {
    logger.error('Error fetching transit subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transit subscriptions', details: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(req) {
  try {
    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);

    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptionId = req.nextUrl?.searchParams.get('id');
    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 });
    }

    const { rows: subRows } = await pool.query(
      'SELECT user_id FROM transit_subscriptions WHERE id = $1',
      [subscriptionId],
    );

    if (subRows.length === 0) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    if (subRows[0].user_id !== authResult.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await pool.query('DELETE FROM transit_subscriptions WHERE id = $1', [subscriptionId]);
    return NextResponse.json({ success: true, message: 'Transit subscription deleted successfully' });
  } catch (error) {
    logger.error('Error deleting transit subscription:', error);
    return NextResponse.json(
      { error: 'Failed to delete transit subscription', details: error.message },
      { status: 500 },
    );
  }
}


