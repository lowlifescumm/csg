/**
 * @fileoverview This script checks if the necessary columns for Google OAuth authentication exist in the 'users' table.
 * It identifies any missing columns and prompts the user to run a database migration if needed.
 *
 * @usage
 * To run this script, use the following command:
 * node scripts/check-google-oauth-columns.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

/**
 * Checks for the existence of Google OAuth-related columns in the 'users' table.
 */
async function checkColumns() {
  try {
    console.log('🔍 Checking for Google OAuth columns in users table...\n');
    
    const { rows } = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
        AND column_name IN ('google_id', 'avatar_url', 'email_verified', 'updated_at')
      ORDER BY column_name;
    `);
    
    const expectedColumns = ['google_id', 'avatar_url', 'email_verified', 'updated_at'];
    const existingColumns = rows.map(r => r.column_name);
    const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));
    
    if (rows.length === 0) {
      console.log('❌ No Google OAuth columns found in users table');
      console.log('\nMissing columns:');
      expectedColumns.forEach(col => console.log(`  - ${col}`));
      console.log('\n⚠️  You need to run the database migration!');
      console.log('   Run this command: npm run db:migrate:google-oauth');
    } else if (missingColumns.length > 0) {
      console.log('⚠️  Some Google OAuth columns are missing:\n');
      missingColumns.forEach(col => console.log(`  ❌ ${col}`));
      console.log('\n✅ Existing columns:');
      rows.forEach(row => {
        console.log(`  ✓ ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
      });
      console.log('\n⚠️  You need to run the database migration!');
    } else {
      console.log('✅ All Google OAuth columns exist in users table:\n');
      rows.forEach(row => {
        console.log(`  ✓ ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
      });
      
      const { rows: passwordRows } = await pool.query(`
        SELECT is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password_hash';
      `);
      
      if (passwordRows.length > 0) {
        const isNullable = passwordRows[0].is_nullable === 'YES';
        if (isNullable) {
          console.log(`  ✓ password_hash (nullable: YES) - OAuth users can have null passwords`);
        } else {
          console.log(`  ⚠️  password_hash (nullable: NO) - This should be nullable for OAuth users`);
        }
      }
      
      console.log('\n✅ Database is ready for Google OAuth!');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkColumns().catch(console.error);
