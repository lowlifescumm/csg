#!/usr/bin/env node
/**
 * @fileoverview This script checks for and adds missing columns and tables required for a user referral system.
 * It ensures the 'users' table has 'referral_code' and 'referred_by' columns, and that the 'referral_redemptions' table exists.
 * It also backfills referral codes for existing users.
 *
 * @usage
 * To run this script, use the following command:
 * node scripts/check-referral-columns.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Pool } = require('pg');

let dbUrl = process.env.DATABASE_URL || '';
dbUrl = dbUrl.replace(/^["']|["']$/g, '');

const sslConfig = !dbUrl.includes('localhost') && dbUrl.includes('render.com') 
  ? { rejectUnauthorized: false } 
  : false;

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
});

/**
 * Checks for and adds the necessary database columns and tables for the referral system.
 */
async function checkReferralColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking for missing referral columns...\n');
    
    const usersColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('referral_code', 'referred_by')
    `);
    
    const existingColumns = usersColumns.rows.map(row => row.column_name);
    console.log('📊 Existing referral columns:', existingColumns);
    
    if (!existingColumns.includes('referral_code')) {
      console.log('🚀 Adding referral_code column...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN referral_code VARCHAR(50) UNIQUE
      `);
      console.log('✅ Added referral_code column');
    }
    
    if (!existingColumns.includes('referred_by')) {
      console.log('🚀 Adding referred_by column...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN referred_by INTEGER REFERENCES users(id)
      `);
      console.log('✅ Added referred_by column');
    }
    
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'referral_redemptions'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('🚀 Creating referral_redemptions table...');
      await client.query(`
        CREATE TABLE referral_redemptions (
            id SERIAL PRIMARY KEY,
            referrer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            referred_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            referrer_rewarded BOOLEAN DEFAULT false,
            referred_rewarded BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(referrer_id, referred_id)
        )
      `);
      console.log('✅ Created referral_redemptions table');
    }
    
    console.log('🚀 Generating referral codes for existing users...');
    await client.query(`
      UPDATE users
      SET referral_code = UPPER(SUBSTRING(MD5(email || id::text), 1, 8))
      WHERE referral_code IS NULL
    `);
    console.log('✅ Generated referral codes');
    
    console.log('\n🎉 All referral columns and tables are ready!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkReferralColumns();
