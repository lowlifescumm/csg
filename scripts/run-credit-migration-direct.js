const logger = require('./lib/logger');
/**
 * Run Credit Migration Directly
 * Executes the migration SQL on production database
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Get DATABASE_URL from command line or environment
const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
  logger.error('❌ DATABASE_URL required');
  logger.error('Usage: node run-credit-migration-direct.js [DATABASE_URL]');
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
    logger.info('📋 Running credit migration...\n');
    
    // Read migration SQL
    const migrationPath = path.join(__dirname, '../database/migrate-old-credits-simple.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query(migrationSQL);
    
    logger.info('✅ Migration completed successfully');
    
    // Verify migration
    logger.info('\n🔍 Verifying migration...');
    
    const verificationResult = await client.query(`
      SELECT 
        COUNT(DISTINCT user_id) as users_migrated,
        SUM(delta) as total_credits_migrated
      FROM credit_ledger
      WHERE source = 'migration_from_old_system'
    `);
    
    const verification = verificationResult.rows[0];
    logger.info(`   Users migrated: ${verification.users_migrated}`);
    logger.info(`   Total credits migrated: ${verification.total_credits_migrated}`);
    
    // Show sample of migrated users
    const sampleResult = await client.query(`
      SELECT 
        u.id as user_id,
        u.email,
        c.credits as old_credits,
        COALESCE((
          SELECT SUM(delta)
          FROM credit_ledger
          WHERE user_id = u.id
            AND (expires_at IS NULL OR expires_at > NOW())
        ), 0) as new_balance
      FROM users u
      LEFT JOIN credits c ON u.id = c.user_id
      WHERE EXISTS (
        SELECT 1 FROM credit_ledger WHERE user_id = u.id AND source = 'migration_from_old_system'
      )
      ORDER BY u.id
      LIMIT 10
    `);
    
    logger.info('\n📊 Sample migrated users:');
    sampleResult.rows.forEach(row => {
      logger.info(`   User ${row.user_id} (${row.email}): ${row.old_credits} → ${row.new_balance} credits`);
    });
    
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



