/**
 * Check if next_free_credit_issue_at column exists in users table
 * Uses DATABASE_URL from environment or command line argument
 */

const { Pool } = require('pg');

const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL required');
  console.error('Usage: node scripts/check-free-credit-column.js [DATABASE_URL]');
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
    console.log('🔗 Connecting to database...');
    
    // Test connection
    const { rows: testRows } = await client.query('SELECT NOW() as now');
    console.log('✅ Database connection successful:', testRows[0].now);
    console.log();

    // Check if column exists
    console.log('🔍 Checking for next_free_credit_issue_at column...');
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
      console.log('❌ Column next_free_credit_issue_at DOES NOT EXIST in users table');
      console.log();
      console.log('💡 Run migration: node scripts/run-free-credit-tracking-migration.js "$DATABASE_URL"');
    } else {
      const col = columns[0];
      console.log('✅ Column next_free_credit_issue_at EXISTS');
      console.log('   Type:', col.data_type);
      console.log('   Nullable:', col.is_nullable);
      console.log('   Default:', col.column_default || 'none');
      console.log();

      // Check index
      console.log('🔍 Checking for index...');
      const { rows: indexes } = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'users'
          AND indexname = 'idx_users_next_free_credit_issue_at'
      `);

      if (indexes.length === 0) {
        console.log('⚠️  Index idx_users_next_free_credit_issue_at does not exist');
      } else {
        console.log('✅ Index exists:', indexes[0].indexname);
        console.log('   Definition:', indexes[0].indexdef);
      }
      console.log();

      // Check user data
      console.log('📊 Checking user data...');
      const { rows: userStats } = await client.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(next_free_credit_issue_at) as users_with_timestamp,
          COUNT(*) FILTER (WHERE next_free_credit_issue_at IS NULL) as users_null_timestamp,
          COUNT(*) FILTER (WHERE next_free_credit_issue_at <= NOW()) as users_eligible_now
        FROM users
      `);

      console.log('   Total users:', userStats[0].total_users);
      console.log('   Users with timestamp:', userStats[0].users_with_timestamp);
      console.log('   Users with NULL timestamp:', userStats[0].users_null_timestamp);
      console.log('   Users eligible for credits now:', userStats[0].users_eligible_now);
      console.log();

      // Sample a few users
      console.log('📋 Sample users:');
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
        console.log(`   User ${user.id} (${user.email}):`);
        console.log(`     Created: ${user.created_at}`);
        console.log(`     Next free credit: ${user.next_free_credit_issue_at || 'NULL'}`);
        console.log();
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

checkColumn();


