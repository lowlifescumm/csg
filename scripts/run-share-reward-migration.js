/**
 * Run Share Reward Tracking Migration
 * Adds has_rewarded_share column to users table
 * 
 * Usage: node scripts/run-share-reward-migration.js [DATABASE_URL]
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL required');
  console.error('Usage: node scripts/run-share-reward-migration.js [DATABASE_URL]');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();

  try {
    console.log('🔗 Connected to database');
    const migrationPath = path.join(__dirname, '../database/add-share-reward-tracking.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute each statement separately
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
          console.log('✓ Executed:', statement.split('\n')[0].trim());
        } catch (error) {
          // Ignore "already exists" errors
          if (['42P07', '42710', '42723', '42P16'].includes(error.code)) {
            console.log('⊘ Skipped (exists):', error.code);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Share reward tracking migration applied');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

