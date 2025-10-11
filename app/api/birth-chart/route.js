import { NextResponse } from 'next/server';
import { calculateBirthChart, interpretBirthChart } from '@/lib/astrology';
import OpenAI from 'openai';
import { Pool } from 'pg';
import { verifyToken } from '@/lib/auth';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

export async function POST(request) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      birthDate,
      birthTime,
      location,
      latitude,
      longitude,
    } = await request.json();

    if (!birthDate || !birthTime || !latitude || !longitude) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hasAccess = await checkPremiumAccess(decoded.userId);
    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Premium feature - upgrade to access birth charts' 
      }, { status: 402 });
    }

    const date = new Date(birthDate);
    const chart = calculateBirthChart(date, birthTime, parseFloat(latitude), parseFloat(longitude));

    const interpretation = await interpretBirthChart(chart, openai);

    const result = await pool.query(
      `INSERT INTO birth_charts 
       (user_id, birth_date, birth_time, location, latitude, longitude, chart_data, interpretation) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id`,
      [decoded.userId, birthDate, birthTime, location, latitude, longitude, JSON.stringify(chart), interpretation]
    );

    return NextResponse.json({
      success: true,
      chartId: result.rows[0].id,
      chart,
      interpretation,
    });
  } catch (error) {
    console.error('Birth chart error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate birth chart',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT id, birth_date, birth_time, location, chart_data, interpretation, created_at 
       FROM birth_charts 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [decoded.userId]
    );

    return NextResponse.json({
      success: true,
      charts: result.rows
    });
  } catch (error) {
    console.error('Fetch charts error:', error);
    return NextResponse.json({ error: 'Failed to fetch charts' }, { status: 500 });
  }
}

async function checkPremiumAccess(userId) {
  const userResult = await pool.query(
    `SELECT role FROM users WHERE id = $1`,
    [userId]
  );
  const userRole = userResult.rows[0]?.role || 'user';
  const isAdmin = userRole === 'admin';
  
  if (isAdmin) {
    return true;
  }

  const result = await pool.query(
    `SELECT 1 FROM subscriptions 
     WHERE user_id = $1 AND status = 'active'`,
    [userId]
  );
  return result.rows.length > 0;
}
