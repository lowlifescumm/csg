#!/usr/bin/env node

/**
 * Test user login with credentials
 * Usage: node scripts/test-user-login.js <email> <password>
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import { getUserByEmail, verifyPassword, generateToken } from '../lib/auth.js';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

async function testLogin(email, password) {
  try {
    console.log(`🧪 Testing login for: ${email}\n`);
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`📧 Normalized email: ${normalizedEmail}\n`);
    
    // Step 1: Get user
    console.log(`1️⃣  Looking up user...`);
    const user = await getUserByEmail(normalizedEmail);
    
    if (!user) {
      console.log(`❌ User not found`);
      
      // Check for case variations
      const { rows: similarUsers } = await pool.query(`
        SELECT id, email, first_name, last_name, created_at
        FROM users 
        WHERE email ILIKE $1
        ORDER BY created_at DESC
        LIMIT 5
      `, [`%${email.split('@')[0]}%`]);
      
      if (similarUsers.length > 0) {
        console.log(`\n🔍 Found similar emails:`);
        similarUsers.forEach(u => {
          console.log(`   - ${u.email} (ID: ${u.id})`);
        });
      }
      
      return false;
    }
    
    console.log(`✅ User found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Role: ${user.role}\n`);
    
    // Step 2: Check password
    console.log(`2️⃣  Checking password...`);
    
    if (!user.password) {
      console.log(`❌ User does not have a password`);
      console.log(`   This account uses Google sign-in only\n`);
      return false;
    }
    
    // Step 3: Verify password
    console.log(`3️⃣  Verifying password...`);
    const isValid = await verifyPassword(password, user.password);
    
    if (!isValid) {
      console.log(`❌ Password verification failed`);
      console.log(`   The password does not match the stored hash\n`);
      
      // Check if email is normalized
      if (user.email !== normalizedEmail) {
        console.log(`⚠️  Email case mismatch detected:`);
        console.log(`   Stored: "${user.email}"`);
        console.log(`   Normalized: "${normalizedEmail}"`);
        console.log(`   This might cause login issues\n`);
      }
      
      return false;
    }
    
    console.log(`✅ Password verification successful!\n`);
    
    // Step 4: Generate token
    console.log(`4️⃣  Generating authentication token...`);
    const token = generateToken(user.id);
    console.log(`✅ Token generated successfully\n`);
    
    // Step 5: Final summary
    console.log(`📋 Login Test Summary:`);
    console.log(`   ✅ User found`);
    console.log(`   ✅ Password verified`);
    console.log(`   ✅ Token generated`);
    console.log(`   ✅ Login should work!\n`);
    
    console.log(`🎉 All tests passed! The user should be able to log in.\n`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error testing login:', error);
    console.error('   Details:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

// Get credentials from command line
const email = process.argv[2] || 'mazatlanexpatit@gmail.com';
const password = process.argv[3] || 'Fit29565$$%^!';

if (!email || !password) {
  console.error('❌ Please provide email and password');
  console.error('   Usage: node scripts/test-user-login.js <email> <password>');
  process.exit(1);
}

testLogin(email, password).then(success => {
  process.exit(success ? 0 : 1);
});

