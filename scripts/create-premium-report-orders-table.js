#!/usr/bin/env node

/**
 * Script to create the premium_report_orders table
 * Run this if the table doesn't exist yet
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

async function createTable() {
  try {
    console.log('🔗 Connecting to database...');
    
    const client = await pool.connect();
    
    try {
      console.log('📋 Creating premium_report_orders table...');
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS premium_report_orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          report_type VARCHAR(50) NOT NULL,
          report_name VARCHAR(255) NOT NULL,
          stripe_session_id VARCHAR(255) UNIQUE,
          stripe_customer_id VARCHAR(255),
          stripe_payment_intent_id VARCHAR(255),
          amount_paid INTEGER NOT NULL,
          status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
          report_pdf_url TEXT,
          report_data JSONB,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          completed_at TIMESTAMP
        )
      `);
      
      console.log('✅ Table created successfully');
      
      // Create indexes
      console.log('📊 Creating indexes...');
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_premium_report_orders_user_id ON premium_report_orders(user_id)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_premium_report_orders_status ON premium_report_orders(status)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_premium_report_orders_stripe_session_id ON premium_report_orders(stripe_session_id)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_premium_report_orders_created_at ON premium_report_orders(created_at)
      `);
      
      console.log('✅ Indexes created successfully');
      
      console.log('\n🎉 Premium report orders table setup complete!');
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  createTable();
}

module.exports = { createTable };

