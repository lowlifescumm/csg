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
  console.log('🔍 Checking Google OAuth Setup...\n');
  
  const issues = [];
  const recommendations = [];

  // 1. Check Environment Variables
  console.log('📋 Environment Variables:');
  const envVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
  };

  for (const [key, value] of Object.entries(envVars)) {
    if (!value) {
      console.log(`  ❌ ${key}: NOT SET`);
      issues.push(`${key} is not set`);
      recommendations.push(`Set ${key} in Render dashboard environment variables`);
    } else {
      const preview = key.includes('SECRET') 
        ? `${value.substring(0, 10)}...` 
        : value.length > 50 
          ? `${value.substring(0, 50)}...`
          : value;
      console.log(`  ✅ ${key}: ${preview}`);
      
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
  console.log('\n🗄️  Database Schema:');
  try {
    // Check password_hash nullable
    const passwordHashCheck = await pool.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'users' 
        AND column_name = 'password_hash'
    `);

    if (passwordHashCheck.rows.length === 0) {
      console.log('  ❌ users table or password_hash column not found');
      issues.push('Database: users table or password_hash column not found');
    } else {
      const isNullable = passwordHashCheck.rows[0].is_nullable === 'YES';
      if (isNullable) {
        console.log('  ✅ password_hash allows NULL (OAuth users can be created)');
      } else {
        console.log('  ❌ password_hash does NOT allow NULL');
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
      console.log('  ✅ google_id column exists');
    } else {
      console.log('  ❌ google_id column does not exist');
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
      console.log('  ✅ avatar_url column exists');
    } else {
      console.log('  ❌ avatar_url column does not exist');
      issues.push('Database: avatar_url column does not exist');
      recommendations.push('Run Google OAuth migration: POST /api/admin/run-google-oauth-migration (with CRON_SECRET)');
    }

  } catch (error) {
    console.log(`  ❌ Database connection error: ${error.message}`);
    issues.push(`Database connection error: ${error.message}`);
  }

  // 3. Check OAuth Callback URL
  console.log('\n🔗 OAuth Configuration:');
  const expectedCallbackUrl = 'https://cosmicspiritguide.com/api/auth/callback/google';
  const actualCallbackUrl = envVars.NEXTAUTH_URL 
    ? `${envVars.NEXTAUTH_URL}/api/auth/callback/google`
    : 'NOT SET (NEXTAUTH_URL required)';
  
  console.log(`  Expected: ${expectedCallbackUrl}`);
  console.log(`  Actual:   ${actualCallbackUrl}`);
  
  if (actualCallbackUrl === expectedCallbackUrl) {
    console.log('  ✅ Callback URL matches');
  } else {
    console.log('  ❌ Callback URL mismatch');
    issues.push(`OAuth callback URL mismatch. Expected: ${expectedCallbackUrl}, Got: ${actualCallbackUrl}`);
    recommendations.push('Update Google OAuth redirect URI in Google Cloud Console to match NEXTAUTH_URL');
  }

  console.log('\n  📝 Google Cloud Console Setup:');
  console.log('    1. Go to: https://console.cloud.google.com/apis/credentials');
  console.log('    2. Select your OAuth 2.0 Client ID');
  console.log('    3. Under "Authorized redirect URIs", add:');
  console.log(`       ${expectedCallbackUrl}`);
  console.log('    4. Save changes');

  // Summary
  console.log('\n📊 Summary:');
  if (issues.length === 0) {
    console.log('  ✅ All checks passed! OAuth should be working.');
  } else {
    console.log(`  ❌ Found ${issues.length} issue(s):`);
    issues.forEach((issue, i) => {
      console.log(`     ${i + 1}. ${issue}`);
    });
    
    if (recommendations.length > 0) {
      console.log('\n  💡 Recommendations:');
      recommendations.forEach((rec, i) => {
        console.log(`     ${i + 1}. ${rec}`);
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
    console.error('❌ Error running OAuth setup check:', error);
    process.exit(1);
  });





