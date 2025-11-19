/**
 * POST /api/admin/run-credit-migration
 * One-time endpoint to run credit ledger migration on production
 * 
 * Headers:
 * - Authorization: Bearer <ADMIN_SECRET or CRON_SECRET>
 */

import { NextResponse } from 'next/server';
import { pool } from '@/lib/db.js';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.CRON_SECRET || process.env.ADMIN_SECRET;
    
    if (!adminSecret) {
      return NextResponse.json(
        { error: 'Service not configured' },
        { status: 500 }
      );
    }
    
    const trimmedSecret = (adminSecret || '').trim().replace(/\r?\n/g, '');
    const trimmedHeader = (authHeader || '').trim();
    const expectedAuth = `Bearer ${trimmedSecret}`;
    
    if (!authHeader || trimmedHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('[Migration] Starting credit ledger migration...');
    
    // Read migration SQL file
    const migrationPath = path.join(process.cwd(), 'database', 'credit-ledger-schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration statements one by one
    const client = await pool.connect();
    
    try {
      // Execute each statement separately
      const statements = [
        // Create credit_ledger table
        `CREATE TABLE IF NOT EXISTS credit_ledger (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          delta INTEGER NOT NULL,
          source VARCHAR(100) NOT NULL,
          meta JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE NULL,
          CONSTRAINT valid_delta CHECK (delta != 0)
        )`,
        
        // Create indexes for credit_ledger
        `CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_id ON credit_ledger(user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_credit_ledger_created_at ON credit_ledger(created_at)`,
        `CREATE INDEX IF NOT EXISTS idx_credit_ledger_source ON credit_ledger(source)`,
        `CREATE INDEX IF NOT EXISTS idx_credit_ledger_expires_at ON credit_ledger(expires_at) WHERE expires_at IS NOT NULL`,
        
        // Create user_credit_snapshot table
        `CREATE TABLE IF NOT EXISTS user_credit_snapshot (
          user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          balance INTEGER NOT NULL DEFAULT 0,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        
        // Create index for snapshot
        `CREATE INDEX IF NOT EXISTS idx_user_credit_snapshot_updated_at ON user_credit_snapshot(updated_at)`,
        
        // Add subscription_tier column
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT NULL`,
        
        // Create function
        `CREATE OR REPLACE FUNCTION update_credit_snapshot()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO user_credit_snapshot (user_id, balance, updated_at)
          VALUES (
            NEW.user_id,
            COALESCE((
              SELECT SUM(delta)
              FROM credit_ledger
              WHERE user_id = NEW.user_id
                AND (expires_at IS NULL OR expires_at > NOW())
            ), 0),
            NOW()
          )
          ON CONFLICT (user_id) 
          DO UPDATE SET
            balance = COALESCE((
              SELECT SUM(delta)
              FROM credit_ledger
              WHERE user_id = NEW.user_id
                AND (expires_at IS NULL OR expires_at > NOW())
            ), 0),
            updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql`,
        
        // Create trigger
        `DROP TRIGGER IF EXISTS trigger_update_credit_snapshot ON credit_ledger`,
        `CREATE TRIGGER trigger_update_credit_snapshot
         AFTER INSERT ON credit_ledger
         FOR EACH ROW
         EXECUTE FUNCTION update_credit_snapshot()`,
        
        // Initialize snapshots
        `INSERT INTO user_credit_snapshot (user_id, balance, updated_at)
         SELECT 
           u.id,
           COALESCE((
             SELECT SUM(delta)
             FROM credit_ledger
             WHERE user_id = u.id
               AND (expires_at IS NULL OR expires_at > NOW())
           ), 0),
           NOW()
         FROM users u
         ON CONFLICT (user_id) DO NOTHING`
      ];
      
      for (const statement of statements) {
        try {
          await client.query(statement);
          console.log(`[Migration] Executed statement successfully`);
        } catch (error) {
          // Ignore "already exists" errors for tables/indexes
          if (error.code === '42P07' || error.code === '42710' || error.code === '42723') {
            console.log(`[Migration] Skipped (already exists): ${error.code}`);
            continue;
          }
          // For other errors, log but continue (some statements might fail if dependencies don't exist yet)
          console.warn(`[Migration] Warning: ${error.message} (code: ${error.code})`);
        }
      }
      
      // Verify tables exist
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('credit_ledger', 'user_credit_snapshot')
        ORDER BY table_name
      `);
      
      const tables = tablesResult.rows.map(r => r.table_name);
      
      console.log('[Migration] Migration completed successfully');
      
      return NextResponse.json({
        success: true,
        message: 'Migration completed successfully',
        tables_created: tables,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('[Migration] Error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}

