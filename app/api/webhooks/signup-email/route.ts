const logger = require('../../../../lib/logger');
// Webhook to trigger welcome email on new signup
// Called immediately after successful user registration

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { sendWelcomeEmail } from '@/lib/nurture-emails';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const authHeader = request.headers.get('authorization');
  const webhookSecret = process.env.WEBHOOK_SECRET;
  
  if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, email, firstName, lastName } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and email' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Create email sequence record
      await client.query(
        `INSERT INTO email_sequences (user_id, sequence_type) 
         VALUES ($1, 'welcome_nurture') 
         ON CONFLICT (user_id, sequence_type) DO NOTHING`,
        [userId]
      );

      // Send welcome email immediately
      const emailResult = await sendWelcomeEmail({
        id: userId,
        email,
        firstName,
        lastName,
      });

      if (emailResult.success) {
        // Update sequence record
        await client.query(
          `UPDATE email_sequences 
           SET email_1_sent = TRUE, 
               email_1_sent_at = NOW(),
               updated_at = NOW()
           WHERE user_id = $1 AND sequence_type = 'welcome_nurture'`,
          [userId]
        );

        // Log event
        await client.query(
          `INSERT INTO email_events (user_id, email_type, email_number, status) VALUES ($1, $2, $3, $4)`,
          [userId, 'welcome_nurture', 1, 'sent']
        );

        return NextResponse.json({
          success: true,
          message: 'Welcome email sent',
          emailId: emailResult.data?.id,
        });
      } else {
        // Log failure but don't fail the request
        await client.query(
          `INSERT INTO email_events (user_id, email_type, email_number, status, error_message) VALUES ($1, $2, $3, $4, $5)`,
          [userId, 'welcome_nurture', 1, 'failed', JSON.stringify(emailResult.error)]
        );

        return NextResponse.json({
          success: false,
          error: 'Failed to send welcome email',
          details: emailResult.error,
        }, { status: 500 });
      }

    } finally {
      client.release();
    }

  } catch (error) {
    logger.error('Signup webhook error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
