import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, getUserById } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function GET() {
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

    const user = await getUserById(decoded.userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get overall statistics
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM idempotency_hits) as total_hits,
        (SELECT COUNT(*) FROM idempotency_hits WHERE created_at >= NOW() - INTERVAL '24 hours') as hits_today,
        (SELECT COUNT(*) FROM idempotency_hits WHERE created_at >= NOW() - INTERVAL '7 days') as hits_this_week,
        (SELECT COUNT(*) FROM idempotency_hits WHERE created_at >= NOW() - INTERVAL '30 days') as hits_this_month
    `);

    // Get hits by event type
    const hitsByEventType = await pool.query(`
      SELECT 
        event_type,
        COUNT(*) as count,
        MAX(created_at) as last_hit
      FROM idempotency_hits
      GROUP BY event_type
      ORDER BY count DESC
    `);

    // Get recent hits (last 50)
    const recentHits = await pool.query(`
      SELECT 
        id,
        event_type,
        payment_intent_id,
        user_id,
        original_ledger_id,
        metadata,
        created_at
      FROM idempotency_hits
      ORDER BY created_at DESC
      LIMIT 50
    `);

    // Get time-series data (hits per day for last 30 days)
    const timeSeries = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        COUNT(DISTINCT event_type) as unique_event_types
      FROM idempotency_hits
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Get hits by hour (last 24 hours) for trending
    const hourlyHits = await pool.query(`
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as count
      FROM idempotency_hits
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY DATE_TRUNC('hour', created_at)
      ORDER BY hour DESC
    `);

    return NextResponse.json({
      summary: {
        total: parseInt(stats.rows[0].total_hits || 0),
        today: parseInt(stats.rows[0].hits_today || 0),
        thisWeek: parseInt(stats.rows[0].hits_this_week || 0),
        thisMonth: parseInt(stats.rows[0].hits_this_month || 0),
      },
      byEventType: hitsByEventType.rows.map(row => ({
        eventType: row.event_type,
        count: parseInt(row.count),
        lastHit: row.last_hit,
      })),
      recentHits: recentHits.rows.map(hit => ({
        id: hit.id,
        eventType: hit.event_type,
        paymentIntentId: hit.payment_intent_id,
        userId: hit.user_id,
        originalLedgerId: hit.original_ledger_id,
        metadata: hit.metadata,
        createdAt: hit.created_at,
      })),
      timeSeries: timeSeries.rows.map(row => ({
        date: row.date,
        count: parseInt(row.count),
        uniqueEventTypes: parseInt(row.unique_event_types),
      })),
      hourlyTrend: hourlyHits.rows.map(row => ({
        hour: row.hour,
        count: parseInt(row.count),
      })),
    });
  } catch (error) {
    console.error('Idempotency metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch idempotency metrics' },
      { status: 500 }
    );
  }
}

