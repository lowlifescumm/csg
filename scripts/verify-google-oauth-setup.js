#!/usr/bin/env node
// Complete Google OAuth Setup Verification
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function verifySetup() {
  console.log('\n🔍 GOOGLE OAUTH SETUP VERIFICATION\n');
  console.log('='.repeat(60));
  
  let allPassed = true;
  
  // 1. Check Environment Variables
  console.log('\n📋 1. Environment Variables');
  console.log('-'.repeat(60));
  
  const envChecks = [
    { name: 'GOOGLE_CLIENT_ID', required: true },
    { name: 'GOOGLE_CLIENT_SECRET', required: true },
    { name: 'NEXTAUTH_URL', required: true },
    { name: 'NEXTAUTH_SECRET', required: true },
    { name: 'JWT_SECRET', required: true },
  ];
  
  envChecks.forEach(check => {
    if (process.env[check.name]) {
      console.log(`✅ ${check.name} is set`);
    } else {
      console.log(`❌ ${check.name} is MISSING`);
      allPassed = false;
    }
  });
  
  // 2. Check Database Schema
  console.log('\n📊 2. Database Schema');
  console.log('-'.repeat(60));
  
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
        console.log(`✅ ${col} (${row.data_type}) exists`);
      } else {
        console.log(`❌ ${col} is MISSING`);
        allPassed = false;
      }
    });
    
    // Check if password_hash is nullable
    const passwordRow = rows.find(r => r.column_name === 'password_hash');
    if (passwordRow) {
      if (passwordRow.is_nullable === 'YES') {
        console.log(`✅ password_hash is nullable (OAuth users can have NULL)`);
      } else {
        console.log(`⚠️  password_hash is NOT nullable (may cause issues for OAuth users)`);
      }
    }
  } catch (error) {
    console.log(`❌ Database check failed: ${error.message}`);
    allPassed = false;
  }
  
  // 3. Check NextAuth File Location
  console.log('\n📁 3. NextAuth Configuration File');
  console.log('-'.repeat(60));
  
  const fs = require('fs');
  const path = require('path');
  
  const appRouterPath = path.join(__dirname, '../app/api/auth/[...nextauth]/route.js');
  const pagesRouterPath = path.join(__dirname, '../pages/api/auth/[...nextauth].js');
  
  if (fs.existsSync(appRouterPath)) {
    console.log('✅ NextAuth route.js exists in App Router location');
  } else {
    console.log('❌ NextAuth route.js NOT FOUND in App Router location');
    allPassed = false;
  }
  
  if (fs.existsSync(pagesRouterPath)) {
    console.log('⚠️  Old Pages Router NextAuth file still exists (should be deleted)');
  } else {
    console.log('✅ Old Pages Router NextAuth file correctly removed');
  }
  
  // 4. Display Configuration Details
  console.log('\n🔧 4. Configuration Details');
  console.log('-'.repeat(60));
  
  if (process.env.NEXTAUTH_URL) {
    console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
    console.log(`Expected redirect URI: ${process.env.NEXTAUTH_URL}/api/auth/callback/google`);
  }
  
  if (process.env.GOOGLE_CLIENT_ID) {
    console.log(`Google Client ID: ${process.env.GOOGLE_CLIENT_ID.substring(0, 30)}...`);
  }
  
  // 5. Final Summary
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('\n✅ ALL CHECKS PASSED! Google OAuth is ready to use.\n');
    console.log('📝 Next Steps:');
    console.log('   1. Make sure Render environment variables are updated');
    console.log('   2. Wait for Render to deploy');
    console.log('   3. Test at: https://cosmicspiritguide.com/login');
    console.log('\n🎉 You\'re all set!\n');
  } else {
    console.log('\n⚠️  SOME CHECKS FAILED - Please review the issues above\n');
  }
  
  await pool.end();
  process.exit(allPassed ? 0 : 1);
}

verifySetup().catch(error => {
  console.error('\n❌ Verification failed:', error.message);
  console.error(error);
  process.exit(1);
});






