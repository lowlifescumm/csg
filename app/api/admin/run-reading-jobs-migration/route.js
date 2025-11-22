import { NextResponse } from 'next/server';
import { pool } from '@/lib/db.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SKIPPABLE_CODES = new Set(['42P07', '42710', '42723']);

function normalizeSecret(secret = '') {
  return secret.trim().replace(/\r?\n/g, '');
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const sharedSecret = normalizeSecret(process.env.CRON_SECRET || process.env.ADMIN_SECRET || '');

    if (!sharedSecret || authHeader.trim() !== `Bearer ${sharedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const statements = [
      `CREATE TABLE IF NOT EXISTS reading_jobs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reading_type VARCHAR(100) NOT NULL,
        status VARCHAR(40) NOT NULL DEFAULT 'pending_validation',
        queue VARCHAR(50) DEFAULT 'default',
        options JSONB DEFAULT '{}'::jsonb,
        idempotency_key VARCHAR(120) NOT NULL,
        dependency_version VARCHAR(50),
        missing_recommended JSONB DEFAULT '[]'::jsonb,
        auto_created JSONB DEFAULT '[]'::jsonb,
        ledger_entry_id INTEGER REFERENCES credit_ledger(id),
        refund_ledger_id INTEGER REFERENCES credit_ledger(id),
        reading_id INTEGER REFERENCES readings(id),
        charge_amount INTEGER,
        last_error TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE (user_id, idempotency_key)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_reading_jobs_user ON reading_jobs(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_reading_jobs_status ON reading_jobs(status)`,
      `CREATE INDEX IF NOT EXISTS idx_reading_jobs_queue ON reading_jobs(queue)`,
      `CREATE OR REPLACE FUNCTION touch_reading_jobs_updated_at()
       RETURNS TRIGGER AS $$
       BEGIN
         NEW.updated_at = NOW();
         RETURN NEW;
       END;
       $$ LANGUAGE plpgsql`,
      `DROP TRIGGER IF EXISTS trg_touch_reading_jobs ON reading_jobs`,
      `CREATE TRIGGER trg_touch_reading_jobs
       BEFORE UPDATE ON reading_jobs
       FOR EACH ROW
       EXECUTE FUNCTION touch_reading_jobs_updated_at()`,
    ];

    const client = await pool.connect();
    const executed = [];

    try {
      for (const statement of statements) {
        try {
          await client.query(statement);
          executed.push(statement.split('\n')[0].trim());
        } catch (error) {
          if (SKIPPABLE_CODES.has(error.code)) {
            console.log('[Reading Jobs Migration] Skipped existing object:', error.code);
            continue;
          }
          throw error;
        }
      }
    } finally {
      client.release();
    }

    return NextResponse.json({
      success: true,
      message: 'Reading jobs schema migration completed',
      executed_count: executed.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Reading Jobs Migration] Error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message, code: error.code },
      { status: 500 },
    );
  }
}
