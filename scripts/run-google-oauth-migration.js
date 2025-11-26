// Run Google OAuth database migration
const { pool } = require('../lib/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🚀 Starting Google OAuth database migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../database/add-google-oauth.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the migration
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






