const logger = require('./lib/logger');
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
    logger.info('🔍 Checking users table columns...\n');
    
    // Check users table columns
    const usersColumns = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    logger.info('📊 Users table columns:');
    usersColumns.rows.forEach(row => {
      logger.info(`   ${row.column_name} (${row.data_type}) - default: ${row.column_default || 'none'}`);
    });
    
    // Check if last_free_credit_refresh exists
    const hasRefreshColumn = usersColumns.rows.some(row => row.column_name === 'last_free_credit_refresh');
    logger.info(`\n🔍 last_free_credit_refresh column exists: ${hasRefreshColumn ? '✅ YES' : '❌ NO'}`);
    
    if (!hasRefreshColumn) {
      logger.info('\n🚀 Adding missing column...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN last_free_credit_refresh TIMESTAMP DEFAULT NOW()
      `);
      logger.info('✅ Added last_free_credit_refresh column');
    }
    
  } catch (error) {
    logger.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsersTable();





