/**
 * Run migration to add conversation_sid column to advisor_sessions table
 * 
 * Usage: node scripts/run-conversation-sid-migration.js [DATABASE_URL]
 * 
 * If DATABASE_URL is not provided, it will use the DATABASE_URL from environment variables
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.argv[2] || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL is required');
  console.error('Usage: node scripts/run-conversation-sid-migration.js [DATABASE_URL]');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : undefined,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔗 Connected to database');
    console.log('📋 Running migration: add conversation_sid to advisor_sessions...\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'database', 'add-conversation-sid-to-sessions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
          console.log('✅ Executed:', statement.substring(0, 50) + '...');
        } catch (error) {
          // Ignore "already exists" errors (idempotent migration)
          if (error.code === '42710' || error.code === '42P07') {
            console.log('⚠️  Skipped (already exists):', statement.substring(0, 50) + '...');
          } else {
            throw error;
          }
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

