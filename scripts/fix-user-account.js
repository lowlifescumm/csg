const logger = require('./lib/logger');
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
    logger.info(`🔧 Fixing user account: ${email}\n`);
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    logger.info(`📧 Normalized email: ${normalizedEmail}\n`);
    
    // Check if user exists (case-insensitive)
    const { rows: userRows } = await pool.query(`
      SELECT id, email, first_name, last_name, role, created_at,
             CASE WHEN password_hash IS NOT NULL THEN 'Has Password' ELSE 'No Password (OAuth)' END as password_status
      FROM users 
      WHERE LOWER(email) = $1
    `, [normalizedEmail]);
    
    if (userRows.length === 0) {
      logger.info(`❌ User not found with email: ${email}`);
      logger.info(`   Searched for normalized: ${normalizedEmail}\n`);
      
      // Check all users with similar emails
      const { rows: similarUsers } = await pool.query(`
        SELECT id, email, first_name, last_name, created_at
        FROM users 
        WHERE email ILIKE $1
        ORDER BY created_at DESC
        LIMIT 5
      `, [`%${email.split('@')[0]}%`]);
      
      if (similarUsers.length > 0) {
        logger.info('🔍 Found similar emails:');
        similarUsers.forEach(user => {
          logger.info(`   - ${user.email} (ID: ${user.id}, Created: ${user.created_at})`);
        });
      }
      
      return;
    }
    
    const user = userRows[0];
    logger.info(`✅ Found user:`);
    logger.info(`   ID: ${user.id}`);
    logger.info(`   Email: ${user.email}`);
    logger.info(`   Name: ${user.first_name} ${user.last_name}`);
    logger.info(`   Role: ${user.role}`);
    logger.info(`   Password Status: ${user.password_status}`);
    logger.info(`   Created: ${user.created_at}\n`);
    
    // Check if email needs normalization
    if (user.email !== normalizedEmail) {
      logger.info(`🔧 Normalizing email: "${user.email}" → "${normalizedEmail}"`);
      
      const { rows: updateRows } = await pool.query(`
        UPDATE users 
        SET email = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, email
      `, [normalizedEmail, user.id]);
      
      logger.info(`✅ Email normalized successfully\n`);
    } else {
      logger.info(`✅ Email is already normalized\n`);
    }
    
    // Check if user has a password
    const { rows: passwordCheck } = await pool.query(`
      SELECT password_hash IS NOT NULL as has_password
      FROM users 
      WHERE id = $1
    `, [user.id]);
    
    if (!passwordCheck[0].has_password) {
      logger.info(`⚠️  User does not have a password (OAuth-only account)`);
      logger.info(`   This account can only be accessed via Google sign-in\n`);
      return;
    }
    
    // Test password verification
    logger.info(`🔐 Testing password verification...`);
    const testUser = await getUserByEmail(normalizedEmail);
    
    if (!testUser || !testUser.password) {
      logger.info(`❌ Could not retrieve user or password hash`);
      return;
    }
    
    // Test with provided password
    const testPassword = process.argv[3] || 'Fit29565$$%^!';
    logger.info(`   Testing password: ${'*'.repeat(testPassword.length)}`);
    
    try {
      const isValid = await verifyPassword(testPassword, testUser.password);
      
      if (isValid) {
        logger.info(`✅ Password verification successful!\n`);
      } else {
        logger.info(`❌ Password verification failed`);
        logger.info(`   The password you provided does not match the stored hash\n`);
        logger.info(`   Options:`);
        logger.info(`   1. Reset the password via the forgot password flow`);
        logger.info(`   2. Check if you're using the correct password`);
        logger.info(`   3. The account might have been created with a different password\n`);
      }
    } catch (error) {
      logger.info(`❌ Error verifying password: ${error.message}\n`);
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
    
    logger.info(`📋 Final User Status:`);
    const final = finalUser[0];
    logger.info(`   Email: ${final.email}`);
    logger.info(`   Email Status: ${final.email_status}`);
    logger.info(`   Password Status: ${final.password_status}`);
    logger.info(`   Role: ${final.role}\n`);
    
    logger.info(`✅ Account fix completed!\n`);
    
  } catch (error) {
    logger.error('❌ Error fixing user account:', error);
    logger.error('   Details:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get email from command line
const email = process.argv[2] || 'mazatlanexpatit@gmail.com';

if (!email) {
  logger.error('❌ Please provide an email address');
  logger.error('   Usage: node scripts/fix-user-account.js <email> [password]');
  process.exit(1);
}

fixUserAccount(email);


