import { NextResponse } from 'next/server';
import { pool } from '@/lib/db.js';
import logger from '@/lib/logger';

/**
 * POST /api/pending-reading-emails
 * Store email for pending reading (email capture gate)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name, readingId, readingType, capturedAt } = body;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Insert into pending_reading_emails table
    const result = await pool.query(
      `INSERT INTO pending_reading_emails 
       (email, name, reading_id, reading_type, captured_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (email, reading_id) 
       DO UPDATE SET 
         name = COALESCE(EXCLUDED.name, pending_reading_emails.name),
         captured_at = EXCLUDED.captured_at,
         updated_at = NOW()
       RETURNING id, email, reading_id`,
      [email.toLowerCase().trim(), name || null, readingId || null, readingType || 'tarot', capturedAt || new Date().toISOString()]
    );

    // Also add to newsletter subscribers if not exists
    try {
      await pool.query(
        `INSERT INTO newsletter_subscribers 
         (email, source, created_at, confirmed)
         VALUES ($1, $2, NOW(), true)
         ON CONFLICT (email) DO NOTHING`,
        [email.toLowerCase().trim(), 'reading_gate']
      );
    } catch (newsletterErr) {
      // Non-fatal - log but don't fail
      logger.warn('[Pending Reading Emails] Newsletter insert failed:', newsletterErr.message);
    }

    logger.info('[Pending Reading Emails] Captured email for reading:', {
      email: email.toLowerCase().trim(),
      readingId,
      readingType,
      recordId: result.rows[0]?.id
    });

    return NextResponse.json({
      success: true,
      id: result.rows[0]?.id,
      message: 'Email captured successfully'
    });

  } catch (error) {
    logger.error('[Pending Reading Emails] Error capturing email:', error);
    return NextResponse.json(
      { error: 'Failed to capture email', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pending-reading-emails
 * Get pending emails for a reading (admin/internal use)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const readingId = searchParams.get('readingId');
    const email = searchParams.get('email');

    let query = 'SELECT * FROM pending_reading_emails WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (readingId) {
      query += ` AND reading_id = $${paramIndex++}`;
      params.push(readingId);
    }

    if (email) {
      query += ` AND email = $${paramIndex++}`;
      params.push(email.toLowerCase().trim());
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const result = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    logger.error('[Pending Reading Emails] Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}
