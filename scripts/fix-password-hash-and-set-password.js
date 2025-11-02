#!/usr/bin/env node
/**
 * URGENT FIX: Add password_hash column and set password for admin account
 * This will restore your ability to login with local authentication
 */

import { Pool } from "pg";
import { hashPassword } from "../lib/auth.js";

// Get DB URL from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: connectionString.includes('localhost') 
    ? false 
    : { rejectUnauthorized: false }
});

async function fixPasswordHash() {
  try {
    console.log('🚀 Starting password_hash fix...\n');

    // Step 1: Add password_hash column if it doesn't exist
    console.log('Step 1: Adding password_hash column...');
    try {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
      `);
      console.log('✅ password_hash column added (or already exists)\n');
    } catch (error) {
      console.error('❌ Failed to add column:', error.message);
      throw error;
    }

    // Step 2: Get your email from command line or use default
    const email = process.argv[2] || 'ethan.fitzhenry@gmail.com';
    const password = process.argv[3] || 'TempPass123!';
    
    console.log(`Step 2: Looking up user: ${email}...`);
    const { rows: userRows } = await pool.query(
      "SELECT id, email, first_name, last_name, role, password_hash FROM users WHERE email = $1",
      [email]
    );

    if (userRows.length === 0) {
      console.log(`❌ User ${email} not found in database.`);
      console.log('Please provide your actual email as the first argument.');
      console.log('Usage: node scripts/fix-password-hash-and-set-password.js your@email.com [password]');
      return;
    }

    const user = userRows[0];
    console.log(`✅ Found user: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Role: ${user.role}\n`);

    // Step 3: Set password
    console.log('Step 3: Setting password...');
    const hashedPassword = await hashPassword(password);
    
    await pool.query(`
      UPDATE users 
      SET password_hash = $1, updated_at = NOW() 
      WHERE id = $2
    `, [hashedPassword, user.id]);
    
    console.log(`✅ Password set for ${email}\n`);

    // Step 4: Verify
    console.log('Step 4: Verifying fix...');
    const { rows: verifyRows } = await pool.query(
      "SELECT password_hash IS NOT NULL as has_password FROM users WHERE email = $1",
      [email]
    );
    
    if (verifyRows[0].has_password) {
      console.log('✅ Verification passed - user has password_hash\n');
    } else {
      console.log('⚠️  Warning: password_hash is still NULL\n');
    }

    console.log('='.repeat(60));
    console.log('✅ SUCCESS! You can now login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('='.repeat(60));
    console.log('\n⚠️  IMPORTANT: Change this password immediately after logging in!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixPasswordHash();

