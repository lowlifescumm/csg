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
