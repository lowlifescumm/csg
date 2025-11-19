#!/usr/bin/env node

/**
 * Fix a specific user account in production
 * Usage: node scripts/fix-user-account.js <email>
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import { getUserByEmail, verifyPassword, hashPassword } from '../lib/auth.js';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

async function fixUserAccount(email) {
  try {
    console.log(`🔧 Fixing user account: ${email}\n`);
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`📧 Normalized email: ${normalizedEmail}\n`);
    
    // Check if user exists (case-insensitive)
    const { rows: userRows } = await pool.query(`
      SELECT id, email, first_name, last_name, role, created_at,
             CASE WHEN password_hash IS NOT NULL THEN 'Has Password' ELSE 'No Password (OAuth)' END as password_status
      FROM users 
      WHERE LOWER(email) = $1
    `, [normalizedEmail]);
    
    if (userRows.length === 0) {
      console.log(`❌ User not found with email: ${email}`);
      console.log(`   Searched for normalized: ${normalizedEmail}\n`);
      
      // Check all users with similar emails
      const { rows: similarUsers } = await pool.query(`
        SELECT id, email, first_name, last_name, created_at
        FROM users 
        WHERE email ILIKE $1
        ORDER BY created_at DESC
        LIMIT 5
      `, [`%${email.split('@')[0]}%`]);
      
      if (similarUsers.length > 0) {
        console.log('🔍 Found similar emails:');
        similarUsers.forEach(user => {
          console.log(`   - ${user.email} (ID: ${user.id}, Created: ${user.created_at})`);
        });
      }
      
      return;
    }
    
    const user = userRows[0];
    console.log(`✅ Found user:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Password Status: ${user.password_status}`);
    console.log(`   Created: ${user.created_at}\n`);
    
    // Check if email needs normalization
    if (user.email !== normalizedEmail) {
      console.log(`🔧 Normalizing email: "${user.email}" → "${normalizedEmail}"`);
      
      const { rows: updateRows } = await pool.query(`
        UPDATE users 
        SET email = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, email
      `, [normalizedEmail, user.id]);
      
      console.log(`✅ Email normalized successfully\n`);
    } else {
      console.log(`✅ Email is already normalized\n`);
    }
    
    // Check if user has a password
    const { rows: passwordCheck } = await pool.query(`
      SELECT password_hash IS NOT NULL as has_password
      FROM users 
      WHERE id = $1
    `, [user.id]);
    
    if (!passwordCheck[0].has_password) {
      console.log(`⚠️  User does not have a password (OAuth-only account)`);
      console.log(`   This account can only be accessed via Google sign-in\n`);
      return;
    }
    
    // Test password verification
    console.log(`🔐 Testing password verification...`);
    const testUser = await getUserByEmail(normalizedEmail);
    
    if (!testUser || !testUser.password) {
      console.log(`❌ Could not retrieve user or password hash`);
      return;
    }
    
    // Test with provided password
    const testPassword = process.argv[3] || 'Fit29565$$%^!';
    console.log(`   Testing password: ${'*'.repeat(testPassword.length)}`);
    
    try {
      const isValid = await verifyPassword(testPassword, testUser.password);
      
      if (isValid) {
        console.log(`✅ Password verification successful!\n`);
      } else {
        console.log(`❌ Password verification failed`);
        console.log(`   The password you provided does not match the stored hash\n`);
        console.log(`   Options:`);
        console.log(`   1. Reset the password via the forgot password flow`);
        console.log(`   2. Check if you're using the correct password`);
        console.log(`   3. The account might have been created with a different password\n`);
      }
    } catch (error) {
      console.log(`❌ Error verifying password: ${error.message}\n`);
    }
    
    // Show final user status
    const { rows: finalUser } = await pool.query(`
      SELECT 
        id, 
        email, 
        first_name, 
        last_name, 
        role,
        created_at,
        CASE WHEN password_hash IS NOT NULL THEN 'Has Password' ELSE 'No Password (OAuth)' END as password_status,
        CASE WHEN email != LOWER(TRIM(email)) THEN 'Not Normalized' ELSE 'Normalized' END as email_status
      FROM users 
      WHERE id = $1
    `, [user.id]);
    
    console.log(`📋 Final User Status:`);
    const final = finalUser[0];
    console.log(`   Email: ${final.email}`);
    console.log(`   Email Status: ${final.email_status}`);
    console.log(`   Password Status: ${final.password_status}`);
    console.log(`   Role: ${final.role}\n`);
    
    console.log(`✅ Account fix completed!\n`);
    
  } catch (error) {
    console.error('❌ Error fixing user account:', error);
    console.error('   Details:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get email from command line
const email = process.argv[2] || 'mazatlanexpatit@gmail.com';

if (!email) {
  console.error('❌ Please provide an email address');
  console.error('   Usage: node scripts/fix-user-account.js <email> [password]');
  process.exit(1);
}

fixUserAccount(email);

