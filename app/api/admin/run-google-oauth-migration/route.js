const logger = require('../../../lib/logger');
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function POST(request) {
  try {
    // Check for CRON_SECRET authentication
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logger.info('🚀 Running Google OAuth database migration...');
    
    // Read and execute the Google OAuth schema SQL
    const schemaPath = path.join(process.cwd(), 'database', 'add-google-oauth.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the entire SQL file as a single query
    // This handles dollar-quoted strings properly
    let migrationResult = 'success';
    let migrationError = null;
    
    try {
      await pool.query(schemaSQL);
    } catch (error) {
      // Check if it's a harmless error (column already exists, etc.)
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate key') ||
          error.message.includes('does not exist') ||
          (error.message.includes('column') && error.message.includes('already'))) {
        migrationResult = 'skipped';
        migrationError = 'Some statements already executed (this is OK)';
      } else {
        migrationResult = 'error';
        migrationError = error.message;
        throw error;
      }
    }
    
    // Verify the migration
    const { rows: columnRows } = await pool.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('google_id', 'avatar_url', 'email_verified', 'password_hash')
      ORDER BY column_name
    `);
    
    const passwordHashNullable = columnRows.find(r => r.column_name === 'password_hash')?.is_nullable === 'YES';
    const hasGoogleId = columnRows.some(r => r.column_name === 'google_id');
    
    return NextResponse.json({
      success: true,
      message: 'Google OAuth migration completed',
      migrationResult,
      migrationError,
      verification: {
        passwordHashNullable,
        hasGoogleId,
        columns: columnRows
      }
    });
    
  } catch (error) {
    logger.error('❌ Error running Google OAuth migration:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed',
        message: error.message,
        details: error.detail || error.hint
      },
      { status: 500 }
    );
  }
}

