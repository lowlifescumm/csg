/**
 * Run Subscription Enhancements Migration (direct DB connection)
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL required');
  console.error('Usage: node scripts/run-subscription-enhancements-migration.js [DATABASE_URL]');
  console.error('Or set DATABASE_URL environment variable');
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
    console.log('🔗 Connected to database');
    console.log('📋 Running subscription enhancements migration...\n');

    const migrationPath = path.join(__dirname, '../database/add-subscription-enhancements.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await client.query(migrationSQL);

    console.log('✅ Subscription enhancements migration completed successfully');
  } catch (error) {
    console.error('\n❌ Subscription enhancements migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();



