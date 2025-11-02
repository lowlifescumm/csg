#!/usr/bin/env node

/**
 * Test NextAuth route configuration
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

console.log('🔍 Testing NextAuth Route Configuration...\n');

// Test if we can import the NextAuth route
try {
  console.log('📦 Testing NextAuth imports...');
  
  // Test if NextAuth can be imported
  const NextAuth = require('next-auth');
  console.log('   ✅ NextAuth imported successfully');
  
  // Test if GoogleProvider can be imported
  const GoogleProvider = require('next-auth/providers/google');
  console.log('   ✅ GoogleProvider imported successfully');
  
  // Test if we can create a basic authOptions
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
  
  // Test if we can create a handler
  const handler = NextAuth(authOptions);
  console.log('   ✅ NextAuth handler created successfully');
  
  // Check if handler has GET and POST methods
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

// Test environment variables
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




