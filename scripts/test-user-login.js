const logger = require('./lib/logger');
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
    logger.info(`🧪 Testing login for: ${email}\n`);
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    logger.info(`📧 Normalized email: ${normalizedEmail}\n`);
    
    // Step 1: Get user
    logger.info(`1️⃣  Looking up user...`);
    const user = await getUserByEmail(normalizedEmail);
    
    if (!user) {
      logger.info(`❌ User not found`);
      
      // Check for case variations
      const { rows: similarUsers } = await pool.query(`
        SELECT id, email, first_name, last_name, created_at
        FROM users 
        WHERE email ILIKE $1
        ORDER BY created_at DESC
        LIMIT 5
      `, [`%${email.split('@')[0]}%`]);
      
      if (similarUsers.length > 0) {
        logger.info(`\n🔍 Found similar emails:`);
        similarUsers.forEach(u => {
          logger.info(`   - ${u.email} (ID: ${u.id})`);
        });
      }
      
      return false;
    }
    
    logger.info(`✅ User found:`);
    logger.info(`   ID: ${user.id}`);
    logger.info(`   Email: ${user.email}`);
    logger.info(`   Name: ${user.first_name} ${user.last_name}`);
    logger.info(`   Role: ${user.role}\n`);
    
    // Step 2: Check password
    logger.info(`2️⃣  Checking password...`);
    
    if (!user.password) {
      logger.info(`❌ User does not have a password`);
      logger.info(`   This account uses Google sign-in only\n`);
      return false;
    }
    
    // Step 3: Verify password
    logger.info(`3️⃣  Verifying password...`);
    const isValid = await verifyPassword(password, user.password);
    
    if (!isValid) {
      logger.info(`❌ Password verification failed`);
      logger.info(`   The password does not match the stored hash\n`);
      
      // Check if email is normalized
      if (user.email !== normalizedEmail) {
        logger.info(`⚠️  Email case mismatch detected:`);
        logger.info(`   Stored: "${user.email}"`);
        logger.info(`   Normalized: "${normalizedEmail}"`);
        logger.info(`   This might cause login issues\n`);
      }
      
      return false;
    }
    
    logger.info(`✅ Password verification successful!\n`);
    
    // Step 4: Generate token
    logger.info(`4️⃣  Generating authentication token...`);
    const token = generateToken(user.id);
    logger.info(`✅ Token generated successfully\n`);
    
    // Step 5: Final summary
    logger.info(`📋 Login Test Summary:`);
    logger.info(`   ✅ User found`);
    logger.info(`   ✅ Password verified`);
    logger.info(`   ✅ Token generated`);
    logger.info(`   ✅ Login should work!\n`);
    
    logger.info(`🎉 All tests passed! The user should be able to log in.\n`);
    
    return true;
    
  } catch (error) {
    logger.error('❌ Error testing login:', error);
    logger.error('   Details:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

// Get credentials from command line
const email = process.argv[2] || 'mazatlanexpatit@gmail.com';
const password = process.argv[3] || 'Fit29565$$%^!';

if (!email || !password) {
  logger.error('❌ Please provide email and password');
  logger.error('   Usage: node scripts/test-user-login.js <email> <password>');
  process.exit(1);
}

testLogin(email, password).then(success => {
  process.exit(success ? 0 : 1);
});


