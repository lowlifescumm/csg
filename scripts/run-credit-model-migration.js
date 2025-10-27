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

console.log('🔍 Database URL preview:', dbUrl.substring(0, 50) + '...');

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
    console.log('🔍 Checking database schema...\n');
    
    // Check credits table columns
    const creditsColumns = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'credits'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Credits table columns:');
    const creditColumnNames = creditsColumns.rows.map(r => r.column_name);
    console.log('   ', creditColumnNames.join(', '));
    
    // Check users table columns
    const usersColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name LIKE '%natal%'
      ORDER BY column_name
    `);
    
    console.log('\n📊 Users table (natal-related columns):');
    const userColumnNames = usersColumns.rows.map(r => r.column_name);
    if (userColumnNames.length === 0) {
      console.log('   (no natal-related columns found)');
    } else {
      console.log('   ', userColumnNames.join(', '));
    }
    
    // Determine what needs to be added
    const needsCreditType = !creditColumnNames.includes('credit_type');
    const needsExpiresAt = !creditColumnNames.includes('expires_at');
    const needsSource = !creditColumnNames.includes('source');
    const needsFreeNatalChart = !userColumnNames.includes('free_natal_chart_used');
    
    console.log('\n📋 Migration Status:');
    console.log('   credit_type column:', needsCreditType ? '❌ Missing' : '✅ Exists');
    console.log('   expires_at column:', needsExpiresAt ? '❌ Missing' : '✅ Exists');
    console.log('   source column:', needsSource ? '❌ Missing' : '✅ Exists');
    console.log('   free_natal_chart_used column:', needsFreeNatalChart ? '❌ Missing' : '✅ Exists');
    
    // Only run migration if needed
    if (!needsCreditType && !needsExpiresAt && !needsSource && !needsFreeNatalChart) {
      console.log('\n✅ All columns already exist! Migration already completed.');
      return;
    }
    
    console.log('\n🚀 Running migration...\n');
    
    // Add missing columns
    if (needsCreditType) {
      console.log('Adding credit_type column...');
      await client.query('ALTER TABLE credits ADD COLUMN credit_type VARCHAR(20) DEFAULT \'paid\'');
      console.log('✅ Added credit_type column');
    }
    
    if (needsExpiresAt) {
      console.log('Adding expires_at column...');
      await client.query('ALTER TABLE credits ADD COLUMN expires_at TIMESTAMP');
      console.log('✅ Added expires_at column');
    }
    
    if (needsSource) {
      console.log('Adding source column...');
      await client.query('ALTER TABLE credits ADD COLUMN source VARCHAR(50)');
      console.log('✅ Added source column');
    }
    
    if (needsFreeNatalChart) {
      console.log('Adding free_natal_chart_used column...');
      await client.query('ALTER TABLE users ADD COLUMN free_natal_chart_used BOOLEAN DEFAULT false');
      console.log('✅ Added free_natal_chart_used column');
    }
    
    // Update existing records
    console.log('\nUpdating existing credit records...');
    await client.query(`
      UPDATE credits 
      SET credit_type = 'paid' 
      WHERE credit_type IS NULL
    `);
    console.log('✅ Updated existing credit records');
    
    // Create index if it doesn't exist
    console.log('\nCreating indexes...');
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_credits_user_type_expiry 
        ON credits(user_id, credit_type, expires_at)
      `);
      console.log('✅ Created index');
    } catch (err) {
      console.log('⚠️  Index may already exist');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
