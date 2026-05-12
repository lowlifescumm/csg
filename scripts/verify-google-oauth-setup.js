const logger = require('./lib/logger');
#!/usr/bin/env node
// Complete Google OAuth Setup Verification
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function verifySetup() {
  logger.info('\n🔍 GOOGLE OAUTH SETUP VERIFICATION\n');
  logger.info('='.repeat(60));
  
  let allPassed = true;
  
  // 1. Check Environment Variables
  logger.info('\n📋 1. Environment Variables');
  logger.info('-'.repeat(60));
  
  const envChecks = [
    { name: 'GOOGLE_CLIENT_ID', required: true },
    { name: 'GOOGLE_CLIENT_SECRET', required: true },
    { name: 'NEXTAUTH_URL', required: true },
    { name: 'NEXTAUTH_SECRET', required: true },
    { name: 'JWT_SECRET', required: true },
  ];
  
  envChecks.forEach(check => {
    if (process.env[check.name]) {
      logger.info(`✅ ${check.name} is set`);
    } else {
      logger.info(`❌ ${check.name} is MISSING`);
      allPassed = false;
    }
  });
  
  // 2. Check Database Schema
  logger.info('\n📊 2. Database Schema');
  logger.info('-'.repeat(60));
  
  try {
    const { rows } = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
        AND column_name IN ('google_id', 'avatar_url', 'email_verified', 'updated_at', 'password_hash')
      ORDER BY column_name;
    `);
    
    const requiredColumns = ['google_id', 'avatar_url', 'email_verified', 'updated_at'];
    const existingColumns = rows.map(r => r.column_name);
    
    requiredColumns.forEach(col => {
      if (existingColumns.includes(col)) {
        const row = rows.find(r => r.column_name === col);
        logger.info(`✅ ${col} (${row.data_type}) exists`);
      } else {
        logger.info(`❌ ${col} is MISSING`);
        allPassed = false;
      }
    });
    
    // Check if password_hash is nullable
    const passwordRow = rows.find(r => r.column_name === 'password_hash');
    if (passwordRow) {
      if (passwordRow.is_nullable === 'YES') {
        logger.info(`✅ password_hash is nullable (OAuth users can have NULL)`);
      } else {
        logger.info(`⚠️  password_hash is NOT nullable (may cause issues for OAuth users)`);
      }
    }
  } catch (error) {
    logger.info(`❌ Database check failed: ${error.message}`);
    allPassed = false;
  }
  
  // 3. Check NextAuth File Location
  logger.info('\n📁 3. NextAuth Configuration File');
  logger.info('-'.repeat(60));
  
  const fs = require('fs');
  const path = require('path');
  
  const appRouterPath = path.join(__dirname, '../app/api/auth/[...nextauth]/route.js');
  const pagesRouterPath = path.join(__dirname, '../pages/api/auth/[...nextauth].js');
  
  if (fs.existsSync(appRouterPath)) {
    logger.info('✅ NextAuth route.js exists in App Router location');
  } else {
    logger.info('❌ NextAuth route.js NOT FOUND in App Router location');
    allPassed = false;
  }
  
  if (fs.existsSync(pagesRouterPath)) {
    logger.info('⚠️  Old Pages Router NextAuth file still exists (should be deleted)');
  } else {
    logger.info('✅ Old Pages Router NextAuth file correctly removed');
  }
  
  // 4. Display Configuration Details
  logger.info('\n🔧 4. Configuration Details');
  logger.info('-'.repeat(60));
  
  if (process.env.NEXTAUTH_URL) {
    logger.info(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
    logger.info(`Expected redirect URI: ${process.env.NEXTAUTH_URL}/api/auth/callback/google`);
  }
  
  if (process.env.GOOGLE_CLIENT_ID) {
    logger.info(`Google Client ID: ${process.env.GOOGLE_CLIENT_ID.substring(0, 30)}...`);
  }
  
  // 5. Final Summary
  logger.info('\n' + '='.repeat(60));
  if (allPassed) {
    logger.info('\n✅ ALL CHECKS PASSED! Google OAuth is ready to use.\n');
    logger.info('📝 Next Steps:');
    logger.info('   1. Make sure Render environment variables are updated');
    logger.info('   2. Wait for Render to deploy');
    logger.info('   3. Test at: https://cosmicspiritguide.com/login');
    logger.info('\n🎉 You\'re all set!\n');
  } else {
    logger.info('\n⚠️  SOME CHECKS FAILED - Please review the issues above\n');
  }
  
  await pool.end();
  process.exit(allPassed ? 0 : 1);
}

verifySetup().catch(error => {
  logger.error('\n❌ Verification failed:', error.message);
  logger.error(error);
  process.exit(1);
});






