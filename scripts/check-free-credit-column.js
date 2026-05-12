const logger = require('./lib/logger');
/**
 * Check if next_free_credit_issue_at column exists in users table
 * Uses DATABASE_URL from environment or command line argument
 */

const { Pool } = require('pg');

const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
  logger.error('❌ DATABASE_URL required');
  logger.error('Usage: node scripts/check-free-credit-column.js [DATABASE_URL]');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
});

async function checkColumn() {
  const client = await pool.connect();

  try {
    logger.info('🔗 Connecting to database...');
    
    // Test connection
    const { rows: testRows } = await client.query('SELECT NOW() as now');
    logger.info('✅ Database connection successful:', testRows[0].now);
    logger.info();

    // Check if column exists
    logger.info('🔍 Checking for next_free_credit_issue_at column...');
    const { rows: columns } = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name = 'next_free_credit_issue_at'
      ORDER BY ordinal_position
    `);

    if (columns.length === 0) {
      logger.info('❌ Column next_free_credit_issue_at DOES NOT EXIST in users table');
      logger.info();
      logger.info('💡 Run migration: node scripts/run-free-credit-tracking-migration.js "$DATABASE_URL"');
    } else {
      const col = columns[0];
      logger.info('✅ Column next_free_credit_issue_at EXISTS');
      logger.info('   Type:', col.data_type);
      logger.info('   Nullable:', col.is_nullable);
      logger.info('   Default:', col.column_default || 'none');
      logger.info();

      // Check index
      logger.info('🔍 Checking for index...');
      const { rows: indexes } = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'users'
          AND indexname = 'idx_users_next_free_credit_issue_at'
      `);

      if (indexes.length === 0) {
        logger.info('⚠️  Index idx_users_next_free_credit_issue_at does not exist');
      } else {
        logger.info('✅ Index exists:', indexes[0].indexname);
        logger.info('   Definition:', indexes[0].indexdef);
      }
      logger.info();

      // Check user data
      logger.info('📊 Checking user data...');
      const { rows: userStats } = await client.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(next_free_credit_issue_at) as users_with_timestamp,
          COUNT(*) FILTER (WHERE next_free_credit_issue_at IS NULL) as users_null_timestamp,
          COUNT(*) FILTER (WHERE next_free_credit_issue_at <= NOW()) as users_eligible_now
        FROM users
      `);

      logger.info('   Total users:', userStats[0].total_users);
      logger.info('   Users with timestamp:', userStats[0].users_with_timestamp);
      logger.info('   Users with NULL timestamp:', userStats[0].users_null_timestamp);
      logger.info('   Users eligible for credits now:', userStats[0].users_eligible_now);
      logger.info();

      // Sample a few users
      logger.info('📋 Sample users:');
      const { rows: sampleUsers } = await client.query(`
        SELECT 
          id, 
          email, 
          next_free_credit_issue_at,
          created_at
        FROM users 
        ORDER BY created_at DESC
        LIMIT 5
      `);

      sampleUsers.forEach(user => {
        logger.info(`   User ${user.id} (${user.email}):`);
        logger.info(`     Created: ${user.created_at}`);
        logger.info(`     Next free credit: ${user.next_free_credit_issue_at || 'NULL'}`);
        logger.info();
      });
    }

  } catch (error) {
    logger.error('❌ Error:', error.message);
    logger.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

checkColumn();


