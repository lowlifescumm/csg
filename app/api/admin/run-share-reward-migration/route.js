import { NextResponse } from 'next/server';
import { pool } from '@/lib/db.js';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SKIPPABLE_CODES = new Set(['42P07', '42710', '42723', '42P16']);

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

    logger.info('[Share Reward Migration] Starting migration...');

    const migrationPath = path.join(process.cwd(), 'database', 'add-share-reward-tracking.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    const client = await pool.connect();
    const executed = [];

    try {
      // Execute each statement separately
      const statements = migrationSQL.split(';').filter(s => s.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await client.query(statement);
            executed.push(statement.split('\n')[0].trim());
          } catch (error) {
            if (SKIPPABLE_CODES.has(error.code)) {
              logger.info('[Share Reward Migration] Skipped existing object:', error.code);
              continue;
            }
            throw error;
          }
        }
      }
    } finally {
      client.release();
    }

    logger.info('[Share Reward Migration] Migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Share reward tracking migration completed',
      executed_count: executed.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[Share Reward Migration] Error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message, code: error.code },
      { status: 500 },
    );
  }
}










