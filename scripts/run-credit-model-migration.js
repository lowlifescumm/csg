const logger = require('./lib/logger');
#!/usr/bin/env node

/**
 * Run Credit & Subscription Pricing Model Migration
 * Safely checks and adds required columns to the database
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Parse database URL
let dbUrl = process.env.DATABASE_URL || '';
// Remove quotes if present
dbUrl = dbUrl.replace(/^["']|["']$/g, '');

logger.info('🔍 Database URL preview:', dbUrl.substring(0, 50) + '...');

const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

// Render database requires SSL
const sslConfig = !isLocalhost && dbUrl.includes('render.com') 
  ? { rejectUnauthorized: false } 
  : false;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    logger.info('🔍 Checking database schema...\n');
    
    // Check credits table columns
    const creditsColumns = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'credits'
      ORDER BY ordinal_position
    `);
    
    logger.info('📊 Credits table columns:');
    const creditColumnNames = creditsColumns.rows.map(r => r.column_name);
    logger.info('   ', creditColumnNames.join(', '));
    
    // Check users table columns
    const usersColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name LIKE '%natal%'
      ORDER BY column_name
    `);
    
    logger.info('\n📊 Users table (natal-related columns):');
    const userColumnNames = usersColumns.rows.map(r => r.column_name);
    if (userColumnNames.length === 0) {
      logger.info('   (no natal-related columns found)');
    } else {
      logger.info('   ', userColumnNames.join(', '));
    }
    
    // Determine what needs to be added
    const needsCreditType = !creditColumnNames.includes('credit_type');
    const needsExpiresAt = !creditColumnNames.includes('expires_at');
    const needsSource = !creditColumnNames.includes('source');
    const needsFreeNatalChart = !userColumnNames.includes('free_natal_chart_used');
    
    logger.info('\n📋 Migration Status:');
    logger.info('   credit_type column:', needsCreditType ? '❌ Missing' : '✅ Exists');
    logger.info('   expires_at column:', needsExpiresAt ? '❌ Missing' : '✅ Exists');
    logger.info('   source column:', needsSource ? '❌ Missing' : '✅ Exists');
    logger.info('   free_natal_chart_used column:', needsFreeNatalChart ? '❌ Missing' : '✅ Exists');
    
    // Only run migration if needed
    if (!needsCreditType && !needsExpiresAt && !needsSource && !needsFreeNatalChart) {
      logger.info('\n✅ All columns already exist! Migration already completed.');
      return;
    }
    
    logger.info('\n🚀 Running migration...\n');
    
    // Add missing columns
    if (needsCreditType) {
      logger.info('Adding credit_type column...');
      await client.query('ALTER TABLE credits ADD COLUMN credit_type VARCHAR(20) DEFAULT \'paid\'');
      logger.info('✅ Added credit_type column');
    }
    
    if (needsExpiresAt) {
      logger.info('Adding expires_at column...');
      await client.query('ALTER TABLE credits ADD COLUMN expires_at TIMESTAMP');
      logger.info('✅ Added expires_at column');
    }
    
    if (needsSource) {
      logger.info('Adding source column...');
      await client.query('ALTER TABLE credits ADD COLUMN source VARCHAR(50)');
      logger.info('✅ Added source column');
    }
    
    if (needsFreeNatalChart) {
      logger.info('Adding free_natal_chart_used column...');
      await client.query('ALTER TABLE users ADD COLUMN free_natal_chart_used BOOLEAN DEFAULT false');
      logger.info('✅ Added free_natal_chart_used column');
    }
    
    // Update existing records
    logger.info('\nUpdating existing credit records...');
    await client.query(`
      UPDATE credits 
      SET credit_type = 'paid' 
      WHERE credit_type IS NULL
    `);
    logger.info('✅ Updated existing credit records');
    
    // Create index if it doesn't exist
    logger.info('\nCreating indexes...');
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_credits_user_type_expiry 
        ON credits(user_id, credit_type, expires_at)
      `);
      logger.info('✅ Created index');
    } catch (err) {
      logger.info('⚠️  Index may already exist');
    }
    
    logger.info('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    logger.error('\n❌ Migration failed:', error.message);
    logger.error('Error details:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
