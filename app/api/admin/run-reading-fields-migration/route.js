const logger = require('../../../../lib/logger');
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db.js';
import { verifyToken } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SKIPPABLE_CODES = new Set(['42P07', '42710', '42723', '42P16', '42704']);

async function checkAuth(request) {
  // Try Bearer token auth first (cron/admin secret)
  const authHeader = request.headers.get('authorization') || '';
  const sharedSecret = (process.env.CRON_SECRET || process.env.ADMIN_SECRET || '').trim().replace(/\r?\n/g, '');
  if (sharedSecret && authHeader === `Bearer ${sharedSecret}`) {
    return { authorized: true };
  }

  // Fall back to cookie-based admin auth
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const { rows } = await pool.query("SELECT role FROM users WHERE id=$1", [decoded.userId]);
        if (rows[0] && rows[0].role === 'admin') {
          return { authorized: true };
        }
      }
    }
  } catch {}

  return { authorized: false };
}

export async function POST(request) {
  try {
    const auth = await checkAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('[Reading Fields Migration] Starting migration...');

    const migrationPath = path.join(process.cwd(), 'database', 'add-reading-fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    const client = await pool.connect();
    const executed = [];

    try {
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        try {
          await client.query(statement);
          executed.push(statement.split('\n')[0].trim());
        } catch (error) {
          if (SKIPPABLE_CODES.has(error.code)) {
            logger.info('[Reading Fields Migration] Skipped:', error.code);
            continue;
          }
          throw error;
        }
      }
    } finally {
      client.release();
    }

    logger.info('[Reading Fields Migration] Completed');

    return NextResponse.json({
      success: true,
      message: 'Reading fields migration completed',
      executed_count: executed.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[Reading Fields Migration] Error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message, code: error.code },
      { status: 500 },
    );
  }
}
