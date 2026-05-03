// Database functions for email nurture sequence

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface EmailSequenceRecord {
  user_id: number;
  sequence_type: string;
  email_1_sent: boolean;
  email_2_sent: boolean;
  email_3_sent: boolean;
  email_4_sent: boolean;
  email_5_sent: boolean;
  email_1_sent_at: Date | null;
  email_2_sent_at: Date | null;
  email_3_sent_at: Date | null;
  email_4_sent_at: Date | null;
  email_5_sent_at: Date | null;
  completed: boolean;
  unsubscribed: boolean;
  created_at: Date;
  updated_at: Date;
}

// Initialize email sequence for new user
export async function initializeEmailSequence(userId: number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO email_sequences (user_id, sequence_type) 
       VALUES ($1, 'welcome_nurture') 
       ON CONFLICT (user_id, sequence_type) DO NOTHING`,
      [userId]
    );
  } finally {
    client.release();
  }
}

// Get sequence status for user
export async function getEmailSequence(userId: number): Promise<EmailSequenceRecord | null> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT * FROM email_sequences 
       WHERE user_id = $1 AND sequence_type = 'welcome_nurture'`,
      [userId]
    );
    return rows[0] || null;
  } finally {
    client.release();
  }
}

// Mark email as sent
export async function markEmailSent(
  userId: number,
  emailNumber: number
): Promise<void> {
  const client = await pool.connect();
  try {
    const completed = emailNumber === 5;
    await client.query(
      `UPDATE email_sequences 
       SET email_${emailNumber}_sent = TRUE, 
           email_${emailNumber}_sent_at = NOW(),
           completed = $2,
           updated_at = NOW()
       WHERE user_id = $1 AND sequence_type = 'welcome_nurture'`,
      [userId, completed]
    );
  } finally {
    client.release();
  }
}

// Log email event
export async function logEmailEvent(
  userId: number,
  emailType: string,
  emailNumber: number,
  status: string,
  errorMessage?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO email_events 
       (user_id, email_type, email_number, status, error_message, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, emailType, emailNumber, status, errorMessage || null, metadata ? JSON.stringify(metadata) : null]
    );
  } finally {
    client.release();
  }
}

// Unsubscribe user from sequence
export async function unsubscribeUser(userId: number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE email_sequences 
       SET unsubscribed = TRUE, updated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );
  } finally {
    client.release();
  }
}

// Get users needing next email (for debugging/monitoring)
export async function getUsersNeedingEmails(): Promise<any[]> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT 
        es.user_id,
        u.email,
        u.first_name as firstName,
        CASE 
          WHEN NOT es.email_1_sent THEN 1
          WHEN NOT es.email_2_sent AND es.email_1_sent_at < NOW() - INTERVAL '2 days' THEN 2
          WHEN NOT es.email_3_sent AND es.email_2_sent_at < NOW() - INTERVAL '3 days' THEN 3
          WHEN NOT es.email_4_sent AND es.email_3_sent_at < NOW() - INTERVAL '3 days' THEN 4
          WHEN NOT es.email_5_sent AND es.email_4_sent_at < NOW() - INTERVAL '4 days' THEN 5
          ELSE NULL
        END as next_email_number
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
      ORDER BY es.created_at ASC
    `);
    return rows;
  } finally {
    client.release();
  }
}
