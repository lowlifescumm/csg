const logger = require('./lib/logger');
#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Use the same connection pattern as the existing app
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function runGoogleOAuthMigration() {
  try {
    logger.info('🚀 Running Google OAuth database migration...');
    
    // Read and execute the Google OAuth schema SQL
    const schemaPath = path.join(__dirname, '../database/add-google-oauth.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the entire SQL file as a single query
    // This handles dollar-quoted strings properly
    try {
      await pool.query(schemaSQL);
      logger.info('✅ Executed Google OAuth migration SQL');
    } catch (error) {
      // Check if it's a harmless error (column already exists, etc.)
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate key') ||
          error.message.includes('does not exist') ||
          (error.message.includes('column') && error.message.includes('already'))) {
        logger.info('⚠️  Some statements already executed (this is OK)');
      } else {
        logger.error('❌ Error executing migration:', error.message);
        throw error;
      }
    }
    
    // Verify the migration
    logger.info('\n🔍 Verifying migration...');
    const { rows: columnRows } = await pool.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('google_id', 'avatar_url', 'email_verified', 'password_hash')
      ORDER BY column_name
    `);
    
    logger.info('\n📊 Users table columns:');
    columnRows.forEach(row => {
      logger.info(`   - ${row.column_name}: nullable=${row.is_nullable}`);
    });
    
    const passwordHashNullable = columnRows.find(r => r.column_name === 'password_hash')?.is_nullable === 'YES';
    const hasGoogleId = columnRows.some(r => r.column_name === 'google_id');
    
    if (passwordHashNullable && hasGoogleId) {
      logger.info('\n✅ Google OAuth database migration completed successfully!');
      logger.info('🎉 Google Sign-In is now enabled!');
    } else {
      logger.info('\n⚠️  Migration may not have completed fully. Please check the database schema.');
    }
    
  } catch (error) {
    logger.error('❌ Error running Google OAuth migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runGoogleOAuthMigration();
