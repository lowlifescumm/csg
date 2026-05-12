const logger = require('../../../../lib/logger');
// API route to process email nurture sequence
// Call this daily via cron job to send scheduled emails

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import {
  sendWelcomeEmail,
  sendFirstReadingEmail,
  sendBirthChartEmail,
  sendCommunityEmail,
  sendSpecialOfferEmail,
} from '@/lib/nurture-emails';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Map email numbers to sender functions
const emailSenders: Record<number, (user: any) => Promise<{ success: boolean; error?: any }>> = {
  1: sendWelcomeEmail,
  2: sendFirstReadingEmail,
  3: sendBirthChartEmail,
  4: sendCommunityEmail,
  5: sendSpecialOfferEmail,
};

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    processed: 0,
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  const client = await pool.connect();

  try {
    // Get all users who need the next email in sequence
    const query = `
      SELECT 
        es.user_id,
        es.email_1_sent,
        es.email_2_sent,
        es.email_3_sent,
        es.email_4_sent,
        es.email_5_sent,
        es.email_1_sent_at,
        es.email_2_sent_at,
        es.email_3_sent_at,
        es.email_4_sent_at,
        es.email_5_sent_at,
        u.email,
        u.first_name as firstName,
        u.last_name as lastName
      FROM email_sequences es
      JOIN users u ON es.user_id = u.id
      WHERE es.completed = FALSE 
        AND es.unsubscribed = FALSE
        AND (
          NOT es.email_1_sent
          OR (NOT es.email_2_sent AND es.email_1_sent_at < NOW() - INTERVAL '2 days')
          OR (NOT es.email_3_sent AND es.email_2_sent_at < NOW() - INTERVAL '3 days')
          OR (NOT es.email_4_sent AND es.email_3_sent_at < NOW() - INTERVAL '3 days')
          OR (NOT es.email_5_sent AND es.email_4_sent_at < NOW() - INTERVAL '4 days')
        )
    `;

    const { rows: users } = await client.query(query);

    for (const user of users) {
      results.processed++;

      // Determine which email to send
      let nextEmailNumber: number | null = null;
      
      if (!user.email_1_sent) {
        nextEmailNumber = 1;
      } else if (!user.email_2_sent && user.email_1_sent_at && new Date(user.email_1_sent_at) < new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)) {
        nextEmailNumber = 2;
      } else if (!user.email_3_sent && user.email_2_sent_at && new Date(user.email_2_sent_at) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)) {
        nextEmailNumber = 3;
      } else if (!user.email_4_sent && user.email_3_sent_at && new Date(user.email_3_sent_at) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)) {
        nextEmailNumber = 4;
      } else if (!user.email_5_sent && user.email_4_sent_at && new Date(user.email_4_sent_at) < new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)) {
        nextEmailNumber = 5;
      }

      if (!nextEmailNumber || !emailSenders[nextEmailNumber]) {
        continue;
      }

      // Send the email
      const sender = emailSenders[nextEmailNumber];
      const emailResult = await sender(user);

      if (emailResult.success) {
        // Update sequence record
        const updateQuery = `
          UPDATE email_sequences 
          SET email_${nextEmailNumber}_sent = TRUE,
              email_${nextEmailNumber}_sent_at = NOW(),
              completed = CASE WHEN ${nextEmailNumber} = 5 THEN TRUE ELSE completed END,
              updated_at = NOW()
          WHERE user_id = $1
        `;
        await client.query(updateQuery, [user.user_id]);

        // Log event
        await client.query(
          `INSERT INTO email_events (user_id, email_type, email_number, status) VALUES ($1, $2, $3, $4)`,
          [user.user_id, 'welcome_nurture', nextEmailNumber, 'sent']
        );

        results.sent++;
      } else {
        results.failed++;
        results.errors.push(`Email ${nextEmailNumber} failed for user ${user.user_id}: ${emailResult.error}`);

        // Log failure
        await client.query(
          `INSERT INTO email_events (user_id, email_type, email_number, status, error_message) VALUES ($1, $2, $3, $4, $5)`,
          [user.user_id, 'welcome_nurture', nextEmailNumber, 'failed', JSON.stringify(emailResult.error)]
        );
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Email sequence cron error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  } finally {
    client.release();
  }
}
