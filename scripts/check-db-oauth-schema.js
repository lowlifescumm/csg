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
  console.log('🔍 Checking Database OAuth Schema...\n');
  
  try {
    // Check password_hash nullable
    const passwordHashCheck = await pool.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'users' 
        AND column_name = 'password_hash'
    `);

    if (passwordHashCheck.rows.length === 0) {
      console.log('❌ users table or password_hash column not found');
      process.exit(1);
    }

    const isNullable = passwordHashCheck.rows[0].is_nullable === 'YES';
    console.log('📋 password_hash column:');
    console.log(`   Nullable: ${isNullable ? '✅ YES (OAuth users allowed)' : '❌ NO (OAuth will fail!)'}`);
    
    if (!isNullable) {
      console.log('\n⚠️  CRITICAL: password_hash does NOT allow NULL!');
      console.log('   Google OAuth will fail because OAuth users have no password.');
      console.log('\n💡 Fix: Run the migration:');
      console.log('   curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" \\');
      console.log('     https://cosmicspiritguide.com/api/admin/run-google-oauth-migration');
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
      console.log('✅ google_id column exists');
    } else {
      console.log('❌ google_id column does not exist');
      console.log('   Run the OAuth migration to add it.');
    }

    // Check avatar_url column
    const avatarUrlCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' 
        AND column_name = 'avatar_url'
    `);

    if (avatarUrlCheck.rows.length > 0) {
      console.log('✅ avatar_url column exists');
    } else {
      console.log('❌ avatar_url column does not exist');
      console.log('   Run the OAuth migration to add it.');
    }

    console.log('\n✅ Database schema check complete!');
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkSchema();





