import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getAuthenticatedUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/auth-config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

// Initialize saved_readings table if it doesn't exist
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS saved_readings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reading_type VARCHAR(50) NOT NULL DEFAULT 'tarot',
      spread_type VARCHAR(100),
      question TEXT,
      cards JSONB,
      interpretation TEXT,
      thumbnail_card VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);
    
    if (!authResult) {
      return NextResponse.json(
        { error: 'Authentication required to save readings' },
        { status: 401 }
      );
    }

    const { userId } = authResult;
    const body = await request.json();
    const { readingType, spreadType, question, cards, interpretation, thumbnailCard } = body;

    if (!cards || !interpretation) {
      return NextResponse.json(
        { error: 'Reading data is required' },
        { status: 400 }
      );
    }

    await ensureTable();

    const result = await pool.query(
      `INSERT INTO saved_readings 
       (user_id, reading_type, spread_type, question, cards, interpretation, thumbnail_card)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [userId, readingType || 'tarot', spreadType, question, JSON.stringify(cards), interpretation, thumbnailCard]
    );

    return NextResponse.json({
      success: true,
      savedReading: {
        id: result.rows[0].id,
        createdAt: result.rows[0].created_at
      }
    });
  } catch (error) {
    console.error('Error saving reading:', error);
    return NextResponse.json(
      { error: 'Failed to save reading', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const authResult = await getAuthenticatedUser(cookieStore, authOptions);
    
    if (!authResult) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { userId } = authResult;

    await ensureTable();

    const result = await pool.query(
      `SELECT id, reading_type, spread_type, question, cards, interpretation, thumbnail_card, created_at
       FROM saved_readings
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      readings: result.rows.map(row => ({
        id: row.id,
        readingType: row.reading_type,
        spreadType: row.spread_type,
        question: row.question,
        cards: row.cards,
        interpretation: row.interpretation,
        thumbnailCard: row.thumbnail_card,
        createdAt: row.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching saved readings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch readings', details: error.message },
      { status: 500 }
    );
  }
}
