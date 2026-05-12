const logger = require('./lib/logger');
/**
 * Check Database OAuth Schema
 * Run this on Render server to check if OAuth migration has been run
 * 
 * Usage: node scripts/check-db-oauth-schema.js
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') 
    ? { rejectUnauthorized: false }
    : false,
});

async function checkSchema() {
  logger.info('🔍 Checking Database OAuth Schema...\n');
  
  try {
    // Check password_hash nullable
    const passwordHashCheck = await pool.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'users' 
        AND column_name = 'password_hash'
    `);

    if (passwordHashCheck.rows.length === 0) {
      logger.info('❌ users table or password_hash column not found');
      process.exit(1);
    }

    const isNullable = passwordHashCheck.rows[0].is_nullable === 'YES';
    logger.info('📋 password_hash column:');
    logger.info(`   Nullable: ${isNullable ? '✅ YES (OAuth users allowed)' : '❌ NO (OAuth will fail!)'}`);
    
    if (!isNullable) {
      logger.info('\n⚠️  CRITICAL: password_hash does NOT allow NULL!');
      logger.info('   Google OAuth will fail because OAuth users have no password.');
      logger.info('\n💡 Fix: Run the migration:');
      logger.info('   curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" \\');
      logger.info('     https://cosmicspiritguide.com/api/admin/run-google-oauth-migration');
      process.exit(1);
    }

    // Check google_id column
    const googleIdCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' 
        AND column_name = 'google_id'
    `);

    if (googleIdCheck.rows.length > 0) {
      logger.info('✅ google_id column exists');
    } else {
      logger.info('❌ google_id column does not exist');
      logger.info('   Run the OAuth migration to add it.');
    }

    // Check avatar_url column
    const avatarUrlCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' 
        AND column_name = 'avatar_url'
    `);

    if (avatarUrlCheck.rows.length > 0) {
      logger.info('✅ avatar_url column exists');
    } else {
      logger.info('❌ avatar_url column does not exist');
      logger.info('   Run the OAuth migration to add it.');
    }

    logger.info('\n✅ Database schema check complete!');
    
  } catch (error) {
    logger.error('❌ Error checking database:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkSchema();






