const logger = require('./lib/logger');
/**
 * Run Reading Jobs Schema Migration
 * Executes the reading jobs SQL on the target database.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
  logger.error('❌ DATABASE_URL required');
  logger.error('Usage: node scripts/run-reading-jobs-migration.js [DATABASE_URL]');
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
    logger.info('📋 Running reading jobs migration...\n');

    const migrationPath = path.join(__dirname, '../database/add-reading-jobs.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await client.query(migrationSQL);

    logger.info('✅ Reading jobs migration completed successfully');
  } catch (error) {
    logger.error('\n❌ Reading jobs migration failed:', error.message);
    logger.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();




