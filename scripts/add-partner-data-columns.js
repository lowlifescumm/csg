#!/usr/bin/env node

/**
 * Script to add partner_data and skip_partner_data columns to premium_report_orders table
 * Usage: node scripts/add-partner-data-columns.js [DATABASE_URL]
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is required. Provide it as an argument or set it as an environment variable.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function addPartnerDataColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Adding partner_data and skip_partner_data columns to premium_report_orders table...');

    // Read and execute the migration SQL
    const sqlPath = path.join(__dirname, '../database/add-premium-report-orders-partner-data.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query('BEGIN');

    // Execute each statement
    const statements = sql.split(';').filter(s => s.trim().length > 0);
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        await client.query(trimmed);
      }
    }

    await client.query('COMMIT');

    console.log('✅ Successfully added partner_data and skip_partner_data columns!');
    console.log('✅ Created index on partner_data column');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error adding columns:', error.message);
    
    if (error.code === '42701') {
      console.log('ℹ️  Columns may already exist. This is okay.');
    } else {
      throw error;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  addPartnerDataColumns()
    .then(() => {
      console.log('🎉 Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addPartnerDataColumns };

