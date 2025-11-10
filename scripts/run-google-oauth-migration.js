/**
 * @fileoverview This script runs a database migration to add the necessary columns for Google OAuth authentication.
 * It executes the SQL commands from the `add-google-oauth.sql` file.
 *
 * @usage
 * To run this script, use the following command:
 * node scripts/run-google-oauth-migration.js
 */
const { pool } = require('../lib/db');
const fs = require('fs');
const path = require('path');

/**
 * Executes the Google OAuth database migration.
 */
async function runMigration() {
  try {
    console.log('🚀 Starting Google OAuth database migration...');
    
    const sqlPath = path.join(__dirname, '../database/add-google-oauth.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Google OAuth database migration completed successfully');
    console.log('');
    console.log('The following columns have been added/verified in the users table:');
    console.log('  - google_id (VARCHAR 255, UNIQUE)');
    console.log('  - avatar_url (TEXT)');
    console.log('  - email_verified (BOOLEAN)');
    console.log('  - updated_at (TIMESTAMP)');
    console.log('');
    console.log('✅ password_hash column is now nullable for OAuth users');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
