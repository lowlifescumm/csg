#!/usr/bin/env node

/**
 * Check users table columns
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Pool } = require('pg');

// Parse database URL
let dbUrl = process.env.DATABASE_URL || '';
// Remove quotes if present
dbUrl = dbUrl.replace(/^["']|["']$/g, '');

// Render database requires SSL
const sslConfig = !dbUrl.includes('localhost') && dbUrl.includes('render.com') 
  ? { rejectUnauthorized: false } 
  : false;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
});

async function checkUsersTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking users table columns...\n');
    
    // Check users table columns
    const usersColumns = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Users table columns:');
    usersColumns.rows.forEach(row => {
      console.log(`   ${row.column_name} (${row.data_type}) - default: ${row.column_default || 'none'}`);
    });
    
    // Check if last_free_credit_refresh exists
    const hasRefreshColumn = usersColumns.rows.some(row => row.column_name === 'last_free_credit_refresh');
    console.log(`\n🔍 last_free_credit_refresh column exists: ${hasRefreshColumn ? '✅ YES' : '❌ NO'}`);
    
    if (!hasRefreshColumn) {
      console.log('\n🚀 Adding missing column...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN last_free_credit_refresh TIMESTAMP DEFAULT NOW()
      `);
      console.log('✅ Added last_free_credit_refresh column');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsersTable();
