const logger = require('../../../lib/logger');
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { sendNewsletterLeadMagnetEmail } from '@/lib/email';

/**
 * POST /api/newsletter
 * Body: { email: string, firstName?: string }
 */
export async function POST(request) {
  try {
    const { email, firstName } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Ensure newsletter_signups table exists
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS newsletter_signups (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          first_name VARCHAR(100),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
    } catch (createError) {
      logger.error('[Newsletter] Failed to ensure newsletter_signups table exists:', createError);
    }

    // Insert or ignore if already exists
    try {
      await pool.query(
        `INSERT INTO newsletter_signups (email, first_name)
         VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE SET
           first_name = COALESCE(EXCLUDED.first_name, newsletter_signups.first_name)`,
        [normalizedEmail, firstName || null]
      );
    } catch (dbError) {
      logger.error('[Newsletter] Failed to save signup:', dbError);
      // Don't block user from getting the lead magnet if DB insert fails
    }

    // Send lead magnet email (non-fatal if it fails)
    const emailResult = await sendNewsletterLeadMagnetEmail(
      normalizedEmail,
      firstName
    );

    if (!emailResult.success) {
      logger.error('[Newsletter] Failed to send lead magnet email:', emailResult.error);
      // Still return success so user sees inline link
      return NextResponse.json({
        success: true,
        message: 'You are subscribed! We had an issue sending the email, but you can download your guide directly here.',
        downloadUrl: 'https://drive.google.com/file/d/15jFmzSH2aj6h4Kl7lPNazFZ9j3gLY5j-/view?usp=sharing',
        emailDeliveryIssue: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'You are subscribed! Your cosmic guide has been emailed to you.',
      downloadUrl: 'https://drive.google.com/file/d/15jFmzSH2aj6h4Kl7lPNazFZ9j3gLY5j-/view?usp=sharing',
    });
  } catch (error) {
    logger.error('[Newsletter] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter. Please try again later.' },
      { status: 500 }
    );
  }
}



