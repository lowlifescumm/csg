const logger = require('./lib/logger');
/**
 * Run Subscription Enhancements Migration (direct DB connection)
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
  logger.error('❌ DATABASE_URL required');
  logger.error('Usage: node scripts/run-subscription-enhancements-migration.js [DATABASE_URL]');
  logger.error('Or set DATABASE_URL environment variable');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
});

async function runMigration() {
  const client = await pool.connect();

  try {
    logger.info('🔗 Connected to database');
    logger.info('📋 Running subscription enhancements migration...\n');

    const migrationPath = path.join(__dirname, '../database/add-subscription-enhancements.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await client.query(migrationSQL);

    logger.info('✅ Subscription enhancements migration completed successfully');
  } catch (error) {
    logger.error('\n❌ Subscription enhancements migration failed:', error.message);
    logger.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();




