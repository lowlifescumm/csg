#!/usr/bin/env node
/**
 * @fileoverview This script tests the NextAuth route configuration by attempting to import NextAuth, GoogleProvider,
 * and create a basic `authOptions` object and handler. It helps diagnose issues related to NextAuth.js setup and dependencies.
 *
 * @usage
 * To run this script, use the following command:
 * node scripts/test-nextauth-route.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

console.log('🔍 Testing NextAuth Route Configuration...\n');

try {
  console.log('📦 Testing NextAuth imports...');
  
  const NextAuth = require('next-auth');
  console.log('   ✅ NextAuth imported successfully');
  
  const GoogleProvider = require('next-auth/providers/google');
  console.log('   ✅ GoogleProvider imported successfully');
  
  const authOptions = {
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
  };
  
  console.log('   ✅ Basic authOptions created successfully');
  
  const handler = NextAuth(authOptions);
  console.log('   ✅ NextAuth handler created successfully');
  
  if (typeof handler.GET === 'function') {
    console.log('   ✅ Handler has GET method');
  } else {
    console.log('   ❌ Handler missing GET method');
  }
  
  if (typeof handler.POST === 'function') {
    console.log('   ✅ Handler has POST method');
  } else {
    console.log('   ❌ Handler missing POST method');
  }
  
  console.log('\n🎉 NextAuth route configuration is valid!');
  
} catch (error) {
  console.error('❌ Error testing NextAuth route:', error.message);
  console.error('Stack trace:', error.stack);
}

console.log('\n🔍 Environment Variables Check:');
const requiredVars = ['NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`   ✅ ${varName}: Set (${value.length} chars)`);
  } else {
    console.log(`   ❌ ${varName}: Missing`);
  }
});

console.log('\n💡 If all checks pass, the 405 error might be due to:');
console.log('   1. Wrong start command (fixed: now using node .next/standalone/server.js)');
console.log('   2. Render deployment configuration');
console.log('   3. Network/proxy issues');
console.log('   4. Build issues');
