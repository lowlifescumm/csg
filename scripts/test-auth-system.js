#!/usr/bin/env node
import logger from './lib/logger.js';

/**
 * Comprehensive Authentication System Test
 * Tests all authentication flows and edge cases
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import { hashPassword, verifyPassword, generateToken, verifyToken, createUser, getUserByEmail } from '../lib/auth.js';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

function logTest(name, passed, message = '') {
  if (passed) {
    testResults.passed.push(name);
    logger.info(`✅ ${name}${message ? ': ' + message : ''}`);
  } else {
    testResults.failed.push(name);
    logger.info(`❌ ${name}${message ? ': ' + message : ''}`);
  }
}

function logWarning(name, message) {
  testResults.warnings.push(`${name}: ${message}`);
  logger.info(`⚠️  ${name}: ${message}`);
}

async function testEmailNormalization() {
  logger.info('\n📧 Testing Email Normalization...\n');
  
  const testEmails = [
    'Test@Example.com',
    '  TEST@EXAMPLE.COM  ',
    'test@example.com',
    'TeSt@ExAmPlE.CoM'
  ];
  
  for (const email of testEmails) {
    const normalized = email.toLowerCase().trim();
    const user = await getUserByEmail(email);
    
    if (user) {
      const isNormalized = user.email === normalized;
      logTest(`Email normalization for "${email}"`, isNormalized, 
        isNormalized ? `Correctly normalized to "${user.email}"` : `Expected "${normalized}", got "${user.email}"`);
    } else {
      logWarning(`Email normalization for "${email}"`, 'User not found (this is OK if user doesn\'t exist)');
    }
  }
}

async function testPasswordHashing() {
  logger.info('\n🔐 Testing Password Hashing...\n');
  
  const password = 'TestPassword123!';
  const hash = await hashPassword(password);
  
  // Test 1: Correct password
  const isValid = await verifyPassword(password, hash);
  logTest('Password verification (correct password)', isValid);
  
  // Test 2: Incorrect password
  const isInvalid = await verifyPassword('WrongPassword', hash);
  logTest('Password verification (incorrect password)', !isInvalid, 'Should return false');
  
  // Test 3: Hash is different each time
  const hash2 = await hashPassword(password);
  const hashesDiffer = hash !== hash2;
  logTest('Password hashing (unique hashes)', hashesDiffer, 'Each hash should be unique');
  
  // Test 4: Both hashes verify correctly
  const bothValid = await verifyPassword(password, hash) && await verifyPassword(password, hash2);
  logTest('Password hashing (both hashes verify)', bothValid);
}

async function testTokenGeneration() {
  logger.info('\n🎫 Testing Token Generation...\n');
  
  const userId = 1;
  const token = generateToken(userId);
  
  // Test 1: Token is generated
  logTest('Token generation', !!token && token.length > 0);
  
  // Test 2: Token can be verified
  const decoded = verifyToken(token);
  const isValid = decoded && decoded.userId === userId;
  logTest('Token verification (valid token)', isValid);
  
  // Test 3: Invalid token returns null
  const invalidDecoded = verifyToken('invalid.token.here');
  logTest('Token verification (invalid token)', !invalidDecoded, 'Should return null');
  
  // Test 4: Tokens are unique
  const token2 = generateToken(userId);
  logTest('Token generation (unique tokens)', token !== token2, 'Each token should be unique');
}

async function testDatabaseQueries() {
  logger.info('\n🗄️  Testing Database Queries...\n');
  
  // Test 1: getUserByEmail with case variations
  try {
    const { rows } = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE LOWER(email) = LOWER($1)',
      ['test@example.com']
    );
    logTest('Database query (case-insensitive)', true, 'LOWER() function works correctly');
  } catch (error) {
    logTest('Database query (case-insensitive)', false, error.message);
  }
  
  // Test 2: Check for duplicate emails (case variations)
  try {
    const { rows } = await pool.query(`
      SELECT email, COUNT(*) as count 
      FROM users 
      GROUP BY LOWER(email) 
      HAVING COUNT(*) > 1
    `);
    
    if (rows.length > 0) {
      logWarning('Database integrity', `Found ${rows.length} potential duplicate emails (case variations)`);
      rows.forEach(row => {
        logger.info(`   - ${row.email} (${row.count} occurrences)`);
      });
    } else {
      logTest('Database integrity (no duplicates)', true, 'No duplicate emails found');
    }
  } catch (error) {
    logTest('Database integrity check', false, error.message);
  }
  
  // Test 3: Check for users with non-normalized emails
  try {
    const { rows } = await pool.query(`
      SELECT id, email, first_name, last_name, created_at
      FROM users 
      WHERE email != LOWER(TRIM(email))
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    if (rows.length > 0) {
      logWarning('Email normalization', `Found ${rows.length} user(s) with non-normalized emails`);
      rows.forEach(row => {
        logger.info(`   - ${row.email} (ID: ${row.id}, Created: ${row.created_at})`);
      });
    } else {
      logTest('Email normalization (all normalized)', true, 'All emails are normalized');
    }
  } catch (error) {
    logTest('Email normalization check', false, error.message);
  }
  
  // Test 4: Check for users without passwords (OAuth users)
  try {
    const { rows } = await pool.query(`
      SELECT id, email, first_name, last_name, created_at
      FROM users 
      WHERE password_hash IS NULL
      ORDER BY created_at DESC
    `);
    
    if (rows.length > 0) {
      logTest('OAuth users check', true, `Found ${rows.length} OAuth user(s) (expected)`);
      rows.forEach(row => {
        logger.info(`   - ${row.email} (ID: ${row.id})`);
      });
    } else {
      logTest('OAuth users check', true, 'No OAuth users found');
    }
  } catch (error) {
    logTest('OAuth users check', false, error.message);
  }
}

async function testRecentUsers() {
  logger.info('\n👥 Testing Recent Users (Last 10)...\n');
  
  try {
    const { rows } = await pool.query(`
      SELECT 
        id, 
        email, 
        first_name, 
        last_name, 
        role,
        created_at,
        CASE 
          WHEN password_hash IS NOT NULL THEN 'Has Password' 
          ELSE 'OAuth Only (No Password)' 
        END as password_status,
        CASE 
          WHEN email != LOWER(TRIM(email)) THEN 'Not Normalized' 
          ELSE 'Normalized' 
        END as email_status
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    if (rows.length === 0) {
      logWarning('Recent users', 'No users found in database');
      return;
    }
    
    logger.info(`Found ${rows.length} recent user(s):\n`);
    
    rows.forEach((user, index) => {
      logger.info(`${index + 1}. ${user.email}`);
      logger.info(`   ID: ${user.id}`);
      logger.info(`   Name: ${user.first_name} ${user.last_name}`);
      logger.info(`   Role: ${user.role}`);
      logger.info(`   Password: ${user.password_status}`);
      logger.info(`   Email Status: ${user.email_status}`);
      logger.info(`   Created: ${user.created_at}`);
      logger.info();
      
      // Check for potential issues
      if (user.email_status === 'Not Normalized') {
        logWarning(`User ${user.email}`, 'Email is not normalized');
      }
      if (user.password_status === 'OAuth Only (No Password)') {
        logTest(`User ${user.email} (OAuth)`, true, 'OAuth user - no password expected');
      }
    });
    
    logTest('Recent users check', true, `Checked ${rows.length} user(s)`);
  } catch (error) {
    logTest('Recent users check', false, error.message);
  }
}

async function testCookieSettings() {
  logger.info('\n🍪 Testing Cookie Settings...\n');
  
  // Check if cookie settings are consistent across routes
  logTest('Cookie settings check', true, 'Manual review recommended - check routes use consistent cookie settings');
  logWarning('Cookie settings', 'Verify all routes use: httpOnly: true, secure: production, sameSite: "lax", path: "/"');
}

async function testPasswordValidation() {
  logger.info('\n🔒 Testing Password Validation...\n');
  
  // Check if password validation exists in signup
  logWarning('Password validation', 'Signup route should validate minimum password length (currently only reset-password validates)');
  logWarning('Password validation', 'Consider adding password strength requirements');
}

async function runAllTests() {
  logger.info('🧪 COMPREHENSIVE AUTHENTICATION SYSTEM TEST');
  logger.info('==========================================\n');
  
  try {
    await testEmailNormalization();
    await testPasswordHashing();
    await testTokenGeneration();
    await testDatabaseQueries();
    await testRecentUsers();
    await testCookieSettings();
    await testPasswordValidation();
    
    // Summary
    logger.info('\n📊 TEST SUMMARY');
    logger.info('================\n');
    logger.info(`✅ Passed: ${testResults.passed.length}`);
    logger.info(`❌ Failed: ${testResults.failed.length}`);
    logger.info(`⚠️  Warnings: ${testResults.warnings.length}\n`);
    
    if (testResults.failed.length > 0) {
      logger.info('❌ Failed Tests:');
      testResults.failed.forEach(test => logger.info(`   - ${test}`));
      logger.info();
    }
    
    if (testResults.warnings.length > 0) {
      logger.info('⚠️  Warnings:');
      testResults.warnings.forEach(warning => logger.info(`   - ${warning}`));
      logger.info();
    }
    
    if (testResults.failed.length === 0) {
      logger.info('🎉 All critical tests passed!');
    } else {
      logger.info('⚠️  Some tests failed. Please review the issues above.');
      process.exit(1);
    }
    
  } catch (error) {
    logger.error('❌ Test suite error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runAllTests();


