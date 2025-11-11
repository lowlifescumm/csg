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

    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_users,
        (SELECT COUNT(*) FROM users WHERE stripe_subscription_id IS NOT NULL AND stripe_subscription_id != '') as premium_subscribers,
        (SELECT COUNT(*) FROM readings WHERE type = 'tarot') as total_tarot_readings,
        (SELECT COUNT(*) FROM horoscopes) as total_horoscopes,
        (SELECT COUNT(*) FROM birth_charts) as total_birth_charts,
        (SELECT COUNT(*) FROM compatibility_reports) as total_compatibility_reports,
        (SELECT COUNT(*) FROM compatibility_purchases WHERE status = 'succeeded') as compatibility_purchases,
        (SELECT COALESCE(SUM(amount), 0) FROM compatibility_purchases WHERE status = 'succeeded') as compatibility_revenue,
        (SELECT COUNT(*) FROM moon_reading_purchases WHERE status = 'succeeded') as moon_reading_purchases,
        (SELECT COALESCE(SUM(amount), 0) FROM moon_reading_purchases WHERE status = 'succeeded') as moon_reading_revenue,
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '24 hours') as new_users_today,
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
        (SELECT COUNT(*) FROM readings WHERE type = 'tarot' AND created_at >= NOW() - INTERVAL '24 hours') as tarot_readings_today,
        (SELECT COUNT(*) FROM birth_charts WHERE created_at >= NOW() - INTERVAL '24 hours') as birth_charts_today
    `);

    const recentUsers = await pool.query(`
      SELECT id, email, first_name, last_name, role, created_at, stripe_subscription_id
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    const recentReadings = await pool.query(`
      SELECT r.id, r.created_at, r.type as reading_type, u.email as user_email
      FROM readings r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC 
      LIMIT 10
    `);

    const totalRevenue = 
      (parseFloat(stats.rows[0].compatibility_revenue) || 0) + 
      (parseFloat(stats.rows[0].moon_reading_revenue) || 0);

    return NextResponse.json({
      stats: {
        users: {
          total: parseInt(stats.rows[0].total_users),
          admins: parseInt(stats.rows[0].admin_users),
          premiumSubscribers: parseInt(stats.rows[0].premium_subscribers),
          newToday: parseInt(stats.rows[0].new_users_today),
          newThisWeek: parseInt(stats.rows[0].new_users_week),
        },
        readings: {
          tarotTotal: parseInt(stats.rows[0].total_tarot_readings),
          tarotToday: parseInt(stats.rows[0].tarot_readings_today),
          horoscopes: parseInt(stats.rows[0].total_horoscopes),
          birthCharts: parseInt(stats.rows[0].total_birth_charts),
          birthChartsToday: parseInt(stats.rows[0].birth_charts_today),
          compatibilityReports: parseInt(stats.rows[0].total_compatibility_reports),
        },
        revenue: {
          total: totalRevenue / 100,
          compatibility: parseFloat(stats.rows[0].compatibility_revenue) / 100 || 0,
          moonReadings: parseFloat(stats.rows[0].moon_reading_revenue) / 100 || 0,
          compatibilityPurchases: parseInt(stats.rows[0].compatibility_purchases),
          moonReadingPurchases: parseInt(stats.rows[0].moon_reading_purchases),
        },
      },
      recentUsers: recentUsers.rows.map(u => ({
        id: u.id,
        email: u.email,
        name: `${u.first_name} ${u.last_name}`,
        role: u.role,
        isPremium: !!u.stripe_subscription_id,
        createdAt: u.created_at,
      })),
      recentReadings: recentReadings.rows.map(r => ({
        id: r.id,
        type: r.reading_type,
        userEmail: r.user_email,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
