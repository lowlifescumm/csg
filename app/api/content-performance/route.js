const logger = require('../../../lib/logger');
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/content-performance
 * Get performance data for content
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const calendarId = searchParams.get('calendarId');
    const days = parseInt(searchParams.get('days')) || 30;
    const summary = searchParams.get('summary');

    // If summary requested, return aggregated stats
    if (summary === 'true') {
      const summaryQuery = `
        SELECT 
          COUNT(DISTINCT cc.id) as total_planned,
          COUNT(DISTINCT CASE WHEN cc.status = 'published' THEN cc.id END) as total_published,
          COUNT(DISTINCT CASE WHEN cc.status = 'writing' THEN cc.id END) as in_writing,
          COUNT(DISTINCT CASE WHEN cc.status = 'scheduled' THEN cc.id END) as scheduled,
          COALESCE(SUM(cp.organic_sessions), 0) as total_organic_sessions,
          COALESCE(SUM(cp.email_signups), 0) as total_email_signups,
          COALESCE(SUM(cp.page_views), 0) as total_page_views
        FROM content_calendar cc
        LEFT JOIN content_performance cp ON cc.id = cp.calendar_id
        WHERE cc.year = 2026 AND cc.quarter = 2
      `;
      const { rows: summaryRows } = await pool.query(summaryQuery);
      
      // Get top performing posts
      const topPostsQuery = `
        SELECT 
          cc.title,
          cc.target_keyword,
          cc.publish_date,
          COALESCE(SUM(cp.organic_sessions), 0) as total_sessions,
          COALESCE(SUM(cp.email_signups), 0) as total_signups
        FROM content_calendar cc
        LEFT JOIN content_performance cp ON cc.id = cp.calendar_id
        WHERE cc.status = 'published'
        GROUP BY cc.id, cc.title, cc.target_keyword, cc.publish_date
        ORDER BY total_sessions DESC
        LIMIT 5
      `;
      const { rows: topPosts } = await pool.query(topPostsQuery);

      return NextResponse.json({
        success: true,
        summary: summaryRows[0],
        topPerformingPosts: topPosts
      });
    }

    let whereClause = '';
    let queryParams = [];

    if (postId) {
      whereClause = 'WHERE cp.post_id = $1';
      queryParams.push(parseInt(postId));
    } else if (calendarId) {
      whereClause = 'WHERE cp.calendar_id = $1';
      queryParams.push(parseInt(calendarId));
    } else {
      // Get recent performance data
      whereClause = 'WHERE cp.recorded_at >= NOW() - INTERVAL \'$1 days\'';
      queryParams.push(days);
    }

    const query = `
      SELECT 
        cp.*,
        cc.title as calendar_title,
        cc.target_keyword,
        cc.publish_date
      FROM content_performance cp
      LEFT JOIN content_calendar cc ON cp.calendar_id = cc.id
      ${whereClause}
      ORDER BY cp.recorded_at DESC
    `;

    const { rows } = await pool.query(query, queryParams);

    return NextResponse.json({
      success: true,
      performance: rows
    });

  } catch (error) {
    logger.error('Content performance API error:', error);
    return NextResponse.json({ error: 'Failed to fetch performance data' }, { status: 500 });
  }
}

/**
 * POST /api/content-performance
 * Record new performance metrics
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
      post_id,
      calendar_id,
      recorded_at = new Date().toISOString().split('T')[0],
      organic_sessions = 0,
      page_views = 0,
      unique_visitors = 0,
      avg_time_on_page = 0,
      bounce_rate = 0,
      email_signups = 0,
      free_readings_triggered = 0,
      premium_conversions = 0,
      revenue_attributed = 0,
      keyword_ranking = null,
      search_impressions = 0,
      search_clicks = 0,
      search_ctr = 0,
      social_shares = 0,
      pinterest_pins = 0
    } = body;

    if (!post_id && !calendar_id) {
      return NextResponse.json({ error: 'post_id or calendar_id is required' }, { status: 400 });
    }

    // Insert or update performance data
    const { rows } = await pool.query(`
      INSERT INTO content_performance (
        post_id, calendar_id, recorded_at, organic_sessions, page_views,
        unique_visitors, avg_time_on_page, bounce_rate, email_signups,
        free_readings_triggered, premium_conversions, revenue_attributed,
        keyword_ranking, search_impressions, search_clicks, search_ctr,
        social_shares, pinterest_pins
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (post_id, recorded_at) DO UPDATE SET
        organic_sessions = EXCLUDED.organic_sessions,
        page_views = EXCLUDED.page_views,
        unique_visitors = EXCLUDED.unique_visitors,
        avg_time_on_page = EXCLUDED.avg_time_on_page,
        bounce_rate = EXCLUDED.bounce_rate,
        email_signups = EXCLUDED.email_signups,
        free_readings_triggered = EXCLUDED.free_readings_triggered,
        premium_conversions = EXCLUDED.premium_conversions,
        revenue_attributed = EXCLUDED.revenue_attributed,
        keyword_ranking = EXCLUDED.keyword_ranking,
        search_impressions = EXCLUDED.search_impressions,
        search_clicks = EXCLUDED.search_clicks,
        search_ctr = EXCLUDED.search_ctr,
        social_shares = EXCLUDED.social_shares,
        pinterest_pins = EXCLUDED.pinterest_pins
      RETURNING *
    `, [post_id, calendar_id, recorded_at, organic_sessions, page_views, unique_visitors,
        avg_time_on_page, bounce_rate, email_signups, free_readings_triggered,
        premium_conversions, revenue_attributed, keyword_ranking, search_impressions,
        search_clicks, search_ctr, social_shares, pinterest_pins]);

    return NextResponse.json({
      success: true,
      performance: rows[0]
    });

  } catch (error) {
    logger.error('Content performance POST error:', error);
    return NextResponse.json({ error: 'Failed to record performance data' }, { status: 500 });
  }
}
