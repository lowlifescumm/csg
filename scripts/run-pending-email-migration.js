#!/usr/bin/env node

/**
 * Run Migration: Add pending_reading_emails and newsletter_subscribers tables
 * Applies the SQL from migrations/004-add-pending-reading-emails.sql
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Parse database URL
let dbUrl = process.env.DATABASE_URL || '';
dbUrl = dbUrl.replace(/^["']|["']$/g, '');

console.log('🔍 Connecting to database...');
console.log('   URL preview:', dbUrl.substring(0, 50) + '...');

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
    console.log('🔍 Checking if tables already exist...\n');
    
    // Check if tables already exist
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('pending_reading_emails', 'newsletter_subscribers')
    `);
    
    const existingTables = tableCheck.rows.map(r => r.table_name);
    console.log('📊 Existing tables:', existingTables.length > 0 ? existingTables.join(', ') : 'none');
    
    if (existingTables.includes('pending_reading_emails') && existingTables.includes('newsletter_subscribers')) {
      console.log('\n✅ Both tables already exist! Migration already completed.');
      return;
    }
    
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '../migrations/004-add-pending-reading-emails.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('\n🚀 Applying migration...');
    console.log('   File:', migrationPath);
    console.log('   SQL length:', migrationSql.length, 'characters\n');
    
    // Execute the SQL
    await client.query(migrationSql);
    
    // Verify tables were created
    const verifyTables = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_name IN ('pending_reading_emails', 'newsletter_subscribers')
    `);
    
    console.log('\n✅ Migration completed successfully!\n');
    console.log('📋 Created tables:');
    for (const row of verifyTables.rows) {
      console.log(`   - ${row.table_name}: ${row.column_count} columns`);
    }
    
    // List indexes created
    const indexCheck = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('pending_reading_emails', 'newsletter_subscribers')
      ORDER BY tablename, indexname
    `);
    
    console.log('\n📋 Created indexes:');
    for (const row of indexCheck.rows) {
      console.log(`   - ${row.indexname} on ${row.tablename}`);
    }
    
    console.log('\n🎉 Migration GSTA-615 complete!');
    
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
