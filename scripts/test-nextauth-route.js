const logger = require('./lib/logger');
#!/usr/bin/env node

/**
 * Test NextAuth route configuration
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

logger.info('🔍 Testing NextAuth Route Configuration...\n');

// Test if we can import the NextAuth route
try {
  logger.info('📦 Testing NextAuth imports...');
  
  // Test if NextAuth can be imported
  const NextAuth = require('next-auth');
  logger.info('   ✅ NextAuth imported successfully');
  
  // Test if GoogleProvider can be imported
  const GoogleProvider = require('next-auth/providers/google');
  logger.info('   ✅ GoogleProvider imported successfully');
  
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
  
  logger.info('   ✅ Basic authOptions created successfully');
  
  // Test if we can create a handler
  const handler = NextAuth(authOptions);
  logger.info('   ✅ NextAuth handler created successfully');
  
  // Check if handler has GET and POST methods
  if (typeof handler.GET === 'function') {
    logger.info('   ✅ Handler has GET method');
  } else {
    logger.info('   ❌ Handler missing GET method');
  }
  
  if (typeof handler.POST === 'function') {
    logger.info('   ✅ Handler has POST method');
  } else {
    logger.info('   ❌ Handler missing POST method');
  }
  
  logger.info('\n🎉 NextAuth route configuration is valid!');
  
} catch (error) {
  logger.error('❌ Error testing NextAuth route:', error.message);
  logger.error('Stack trace:', error.stack);
}

// Test environment variables
logger.info('\n🔍 Environment Variables Check:');
const requiredVars = ['NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    logger.info(`   ✅ ${varName}: Set (${value.length} chars)`);
  } else {
    logger.info(`   ❌ ${varName}: Missing`);
  }
});

logger.info('\n💡 If all checks pass, the 405 error might be due to:');
logger.info('   1. Wrong start command (fixed: now using node .next/standalone/server.js)');
logger.info('   2. Render deployment configuration');
logger.info('   3. Network/proxy issues');
logger.info('   4. Build issues');





