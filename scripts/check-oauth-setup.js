const logger = require('./lib/logger');
/**
 * Check Google OAuth Setup
 * 
 * This script verifies that Google OAuth is properly configured:
 * 1. Environment variables
 * 2. Database schema (migration status)
 * 3. Google OAuth redirect URI configuration
 * 
 * Usage: node scripts/check-oauth-setup.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') 
    ? { rejectUnauthorized: false }
    : false,
});

async function checkOAuthSetup() {
  logger.info('🔍 Checking Google OAuth Setup...\n');
  
  const issues = [];
  const recommendations = [];

  // 1. Check Environment Variables
  logger.info('📋 Environment Variables:');
  const envVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
  };

  for (const [key, value] of Object.entries(envVars)) {
    if (!value) {
      logger.info(`  ❌ ${key}: NOT SET`);
      issues.push(`${key} is not set`);
      recommendations.push(`Set ${key} in Render dashboard environment variables`);
    } else {
      const preview = key.includes('SECRET') 
        ? `${value.substring(0, 10)}...` 
        : value.length > 50 
          ? `${value.substring(0, 50)}...`
          : value;
      logger.info(`  ✅ ${key}: ${preview}`);
      
      // Validate specific values
      if (key === 'GOOGLE_CLIENT_ID' && !value.includes('.apps.googleusercontent.com')) {
        issues.push(`${key} appears invalid (should contain .apps.googleusercontent.com)`);
      }
      if (key === 'NEXTAUTH_URL' && value !== 'https://cosmicspiritguide.com') {
        issues.push(`${key} is "${value}" but should be "https://cosmicspiritguide.com"`);
        recommendations.push(`Update ${key} to https://cosmicspiritguide.com in Render dashboard`);
      }
      if (key === 'NEXTAUTH_SECRET' && value.length < 32) {
        issues.push(`${key} is too short (should be at least 32 characters)`);
      }
    }
  }

  // 2. Check Database Schema
  logger.info('\n🗄️  Database Schema:');
  try {
    // Check password_hash nullable
    const passwordHashCheck = await pool.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'users' 
        AND column_name = 'password_hash'
    `);

    if (passwordHashCheck.rows.length === 0) {
      logger.info('  ❌ users table or password_hash column not found');
      issues.push('Database: users table or password_hash column not found');
    } else {
      const isNullable = passwordHashCheck.rows[0].is_nullable === 'YES';
      if (isNullable) {
        logger.info('  ✅ password_hash allows NULL (OAuth users can be created)');
      } else {
        logger.info('  ❌ password_hash does NOT allow NULL');
        issues.push('Database: password_hash column does NOT allow NULL values');
        recommendations.push('Run Google OAuth migration: POST /api/admin/run-google-oauth-migration (with CRON_SECRET)');
      }
    }

    // Check google_id column
    const googleIdCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' 
        AND column_name = 'google_id'
    `);

    if (googleIdCheck.rows.length > 0) {
      logger.info('  ✅ google_id column exists');
    } else {
      logger.info('  ❌ google_id column does not exist');
      issues.push('Database: google_id column does not exist');
      recommendations.push('Run Google OAuth migration: POST /api/admin/run-google-oauth-migration (with CRON_SECRET)');
    }

    // Check avatar_url column
    const avatarUrlCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' 
        AND column_name = 'avatar_url'
    `);

    if (avatarUrlCheck.rows.length > 0) {
      logger.info('  ✅ avatar_url column exists');
    } else {
      logger.info('  ❌ avatar_url column does not exist');
      issues.push('Database: avatar_url column does not exist');
      recommendations.push('Run Google OAuth migration: POST /api/admin/run-google-oauth-migration (with CRON_SECRET)');
    }

  } catch (error) {
    logger.info(`  ❌ Database connection error: ${error.message}`);
    issues.push(`Database connection error: ${error.message}`);
  }

  // 3. Check OAuth Callback URL
  logger.info('\n🔗 OAuth Configuration:');
  const expectedCallbackUrl = 'https://cosmicspiritguide.com/api/auth/callback/google';
  const actualCallbackUrl = envVars.NEXTAUTH_URL 
    ? `${envVars.NEXTAUTH_URL}/api/auth/callback/google`
    : 'NOT SET (NEXTAUTH_URL required)';
  
  logger.info(`  Expected: ${expectedCallbackUrl}`);
  logger.info(`  Actual:   ${actualCallbackUrl}`);
  
  if (actualCallbackUrl === expectedCallbackUrl) {
    logger.info('  ✅ Callback URL matches');
  } else {
    logger.info('  ❌ Callback URL mismatch');
    issues.push(`OAuth callback URL mismatch. Expected: ${expectedCallbackUrl}, Got: ${actualCallbackUrl}`);
    recommendations.push('Update Google OAuth redirect URI in Google Cloud Console to match NEXTAUTH_URL');
  }

  logger.info('\n  📝 Google Cloud Console Setup:');
  logger.info('    1. Go to: https://console.cloud.google.com/apis/credentials');
  logger.info('    2. Select your OAuth 2.0 Client ID');
  logger.info('    3. Under "Authorized redirect URIs", add:');
  logger.info(`       ${expectedCallbackUrl}`);
  logger.info('    4. Save changes');

  // Summary
  logger.info('\n📊 Summary:');
  if (issues.length === 0) {
    logger.info('  ✅ All checks passed! OAuth should be working.');
  } else {
    logger.info(`  ❌ Found ${issues.length} issue(s):`);
    issues.forEach((issue, i) => {
      logger.info(`     ${i + 1}. ${issue}`);
    });
    
    if (recommendations.length > 0) {
      logger.info('\n  💡 Recommendations:');
      recommendations.forEach((rec, i) => {
        logger.info(`     ${i + 1}. ${rec}`);
      });
    }
  }

  await pool.end();
  
  return {
    success: issues.length === 0,
    issues,
    recommendations,
  };
}

// Run the check
checkOAuthSetup()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    logger.error('❌ Error running OAuth setup check:', error);
    process.exit(1);
  });






