const logger = require('./lib/logger');
/**
 * Run Credit Ledger Migration
 * Sets up the credit_ledger and user_credit_snapshot tables
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  logger.error('❌ DATABASE_URL not found in environment variables');
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
    logger.info('📋 Running credit ledger migration...\n');
    
    // Read migration SQL file
    const migrationPath = path.join(__dirname, '../database/credit-ledger-schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query(migrationSQL);
    
    logger.info('✅ Credit ledger tables created successfully');
    logger.info('✅ User credit snapshots initialized');
    logger.info('✅ Triggers and functions created');
    
    // Verify tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('credit_ledger', 'user_credit_snapshot')
      ORDER BY table_name
    `);
    
    logger.info('\n📊 Created tables:');
    tablesResult.rows.forEach(row => {
      logger.info(`   - ${row.table_name}`);
    });
    
    // Check if subscription_tier column exists
    const columnResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'subscription_tier'
    `);
    
    if (columnResult.rows.length > 0) {
      logger.info('\n✅ subscription_tier column exists in users table');
    } else {
      logger.info('\n⚠️  subscription_tier column not found (will be created by migration)');
    }
    
    logger.info('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    logger.error('\n❌ Migration failed:', error.message);
    logger.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

