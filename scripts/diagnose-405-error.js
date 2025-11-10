#!/usr/bin/env node
/**
 * @fileoverview This script is a comprehensive diagnostic tool for troubleshooting 405 (Method Not Allowed) errors,
 * which are common with NextAuth.js setups. It checks environment variables, Next.js configuration,
 * NextAuth route handlers, and `package.json` scripts to identify common misconfigurations.
 *
 * @usage
 * To run this script, use the following command:
 * node scripts/diagnose-405-error.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

console.log('🔍 Diagnosing 405 Error Issues...\n');

console.log('📋 Environment Variables:');
const requiredEnvVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET', 
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'JWT_SECRET',
  'DATABASE_URL'
];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`   ✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`   ❌ ${varName}: MISSING`);
  }
});

console.log('\n🔍 NextAuth Configuration Issues:');

const nextAuthUrl = process.env.NEXTAUTH_URL;
if (nextAuthUrl) {
  console.log(`   NEXTAUTH_URL: ${nextAuthUrl}`);
  
  try {
    const url = new URL(nextAuthUrl);
    console.log(`   ✅ Valid URL format`);
    console.log(`   Protocol: ${url.protocol}`);
    console.log(`   Host: ${url.host}`);
    console.log(`   Port: ${url.port || 'default'}`);
  } catch (e) {
    console.log(`   ❌ Invalid URL format: ${e.message}`);
  }
} else {
  console.log('   ❌ NEXTAUTH_URL not set');
}

console.log('\n🔍 Environment Detection:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`   PORT: ${process.env.PORT || 'undefined'}`);

console.log('\n🔍 Next.js Configuration:');
const fs = require('fs');
const path = require('path');

try {
  const nextConfigPath = path.join(__dirname, '../next.config.js');
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (nextConfig.includes('output: \'standalone\'')) {
    console.log('   ⚠️  Standalone output detected - this affects how the app starts');
    console.log('   💡 For standalone, use: node .next/standalone/server.js');
    console.log('   💡 For regular, use: next start');
  }
  
  if (nextConfig.includes('serverActions')) {
    console.log('   ✅ Server Actions configured');
  }
} catch (e) {
  console.log(`   ❌ Could not read next.config.js: ${e.message}`);
}

console.log('\n🔍 NextAuth Route Check:');
const nextAuthRoutePath = path.join(__dirname, '../app/api/auth/[...nextauth]/route.js');
try {
  const nextAuthRoute = fs.readFileSync(nextAuthRoutePath, 'utf8');
  
  if (nextAuthRoute.includes('export { handler as GET, handler as POST }')) {
    console.log('   ✅ NextAuth route exports GET and POST handlers');
  } else {
    console.log('   ❌ NextAuth route missing GET/POST exports');
  }
  
  if (nextAuthRoute.includes('GoogleProvider')) {
    console.log('   ✅ GoogleProvider configured');
  } else {
    console.log('   ❌ GoogleProvider not found');
  }
  
  if (nextAuthRoute.includes('authOptions')) {
    console.log('   ✅ authOptions defined');
  } else {
    console.log('   ❌ authOptions not found');
  }
  
} catch (e) {
  console.log(`   ❌ Could not read NextAuth route: ${e.message}`);
}

console.log('\n🔍 Package.json Scripts:');
try {
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  console.log('   Available scripts:');
  Object.keys(packageJson.scripts).forEach(script => {
    console.log(`     ${script}: ${packageJson.scripts[script]}`);
  });
  
} catch (e) {
  console.log(`   ❌ Could not read package.json: ${e.message}`);
}

console.log('\n🎯 Common 405 Error Causes:');
console.log('   1. ❌ Missing GET/POST exports in NextAuth route');
console.log('   2. ❌ Incorrect NEXTAUTH_URL configuration');
console.log('   3. ❌ Wrong port configuration');
console.log('   4. ❌ Standalone output with wrong start command');
console.log('   5. ❌ Missing environment variables');
console.log('   6. ❌ CORS issues');
console.log('   7. ❌ NextAuth configuration errors');

console.log('\n💡 Recommended Fixes:');
console.log('   1. Ensure NEXTAUTH_URL matches your actual domain/port');
console.log('   2. For production: NEXTAUTH_URL=https://cosmicspiritguide.com');
console.log('   3. For development: NEXTAUTH_URL=http://localhost:5000');
console.log('   4. Use correct start command based on output config');
console.log('   5. Verify all environment variables are set in Render');
