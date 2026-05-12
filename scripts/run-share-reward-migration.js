const logger = require('./lib/logger');
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
  logger.error('❌ DATABASE_URL required');
  logger.error('Usage: node scripts/run-share-reward-migration.js [DATABASE_URL]');
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
    logger.info('🔗 Connected to database');
    const migrationPath = path.join(__dirname, '../database/add-share-reward-tracking.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute each statement separately
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
          logger.info('✓ Executed:', statement.split('\n')[0].trim());
        } catch (error) {
          // Ignore "already exists" errors
          if (['42P07', '42710', '42723', '42P16'].includes(error.code)) {
            logger.info('⊘ Skipped (exists):', error.code);
          } else {
            throw error;
          }
        }
      }
    }
    
    logger.info('✅ Share reward tracking migration applied');
  } catch (error) {
    logger.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

