#!/usr/bin/env node

// Normalize all user emails to lowercase
// This fixes case-sensitivity issues with login/registration

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

async function normalizeEmails() {
  try {
    console.log('🔧 Normalizing user emails to lowercase...\n');

    // First, check how many users have non-normalized emails
    const { rows: checkRows } = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE email != LOWER(TRIM(email))
    `);

    const countToFix = parseInt(checkRows[0].count);
    console.log(`📊 Found ${countToFix} user(s) with non-normalized emails\n`);

    if (countToFix === 0) {
      console.log('✅ All emails are already normalized!\n');
      return;
    }

    // Show which users will be affected
    const { rows: affectedUsers } = await pool.query(`
      SELECT id, email, first_name, last_name, created_at,
             CASE WHEN password_hash IS NOT NULL THEN 'Has Password' ELSE 'No Password (OAuth)' END as password_status
      FROM users 
      WHERE email != LOWER(TRIM(email))
      ORDER BY created_at DESC
    `);

    console.log('👥 Users that will be normalized:');
    affectedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} → ${user.email.toLowerCase().trim()}`);
      console.log(`      Name: ${user.first_name} ${user.last_name}`);
      console.log(`      Status: ${user.password_status}`);
      console.log(`      Created: ${user.created_at}`);
      console.log();
    });

    // Normalize the emails
    const { rows: updateRows } = await pool.query(`
      UPDATE users 
      SET email = LOWER(TRIM(email))
      WHERE email != LOWER(TRIM(email))
      RETURNING id, email, first_name, last_name
    `);

    console.log(`✅ Successfully normalized ${updateRows.length} user email(s)\n`);

    // Verify the update
    const { rows: verifyRows } = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE email != LOWER(TRIM(email))
    `);

    if (parseInt(verifyRows[0].count) === 0) {
      console.log('✅ Verification passed: All emails are now normalized!\n');
    } else {
      console.log(`⚠️  Warning: ${verifyRows[0].count} email(s) still need normalization\n`);
    }

    // Show the last 10 users for verification
    const { rows: recentUsers } = await pool.query(`
      SELECT 
        id, 
        email, 
        first_name, 
        last_name, 
        created_at,
        CASE WHEN password_hash IS NOT NULL THEN 'Has Password' ELSE 'No Password (OAuth)' END as password_status
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    console.log('📋 Recent users (last 10):');
    recentUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.password_status})`);
    });
    console.log();

  } catch (error) {
    console.error('❌ Error normalizing emails:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the normalization
normalizeEmails();

