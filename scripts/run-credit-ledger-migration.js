/**
 * Run Credit Ledger Migration
 * Sets up the credit_ledger and user_credit_snapshot tables
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔗 Connected to database');
    console.log('📋 Running credit ledger migration...\n');
    
    // Read migration SQL file
    const migrationPath = path.join(__dirname, '../database/credit-ledger-schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('✅ Credit ledger tables created successfully');
    console.log('✅ User credit snapshots initialized');
    console.log('✅ Triggers and functions created');
    
    // Verify tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('credit_ledger', 'user_credit_snapshot')
      ORDER BY table_name
    `);
    
    console.log('\n📊 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check if subscription_tier column exists
    const columnResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'subscription_tier'
    `);
    
    if (columnResult.rows.length > 0) {
      console.log('\n✅ subscription_tier column exists in users table');
    } else {
      console.log('\n⚠️  subscription_tier column not found (will be created by migration)');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

