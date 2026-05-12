const logger = require('../../../lib/logger');
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db.js';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SKIPPABLE_CODES = new Set(['42P07', '42710', '42723', '42P16', '42704']);

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

    logger.info('[Reading Results Migration] Starting migration...');

    const migrationPath = path.join(process.cwd(), 'database', 'add-reading-results.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    const client = await pool.connect();
    const executed = [];

    try {
      // Split SQL statements properly, handling dollar-quoted strings
      // Dollar-quoted strings use $$ markers and can contain semicolons
      const statements = [];
      let currentStatement = '';
      let inDollarQuote = false;
      let dollarQuoteTag = '';
      const lines = migrationSQL.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        currentStatement += line + '\n';

        // Check for dollar quote start/end
        const dollarQuoteMatch = line.match(/\$([^$]*)\$/g);
        if (dollarQuoteMatch) {
          for (const match of dollarQuoteMatch) {
            if (!inDollarQuote) {
              // Starting a dollar quote
              inDollarQuote = true;
              dollarQuoteTag = match;
            } else if (match === dollarQuoteTag) {
              // Ending the dollar quote
              inDollarQuote = false;
              dollarQuoteTag = '';
            }
          }
        }

        // Only split on semicolon if not inside a dollar-quoted string
        if (!inDollarQuote && line.trim().endsWith(';')) {
          const statement = currentStatement.trim();
          if (statement) {
            statements.push(statement);
          }
          currentStatement = '';
        }
      }

      // Add any remaining statement
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }

      // Execute each statement
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await client.query(statement);
            executed.push(statement.split('\n')[0].trim());
          } catch (error) {
            if (SKIPPABLE_CODES.has(error.code)) {
              logger.info('[Reading Results Migration] Skipped existing object:', error.code);
              continue;
            }
            throw error;
          }
        }
      }
    } finally {
      client.release();
    }

    logger.info('[Reading Results Migration] Migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Reading results migration completed',
      executed_count: executed.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[Reading Results Migration] Error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message, code: error.code },
      { status: 500 },
    );
  }
}

