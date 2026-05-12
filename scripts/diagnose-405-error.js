const logger = require('./lib/logger');
#!/usr/bin/env node

/**
 * Comprehensive diagnostic script for 405 errors
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

logger.info('🔍 Diagnosing 405 Error Issues...\n');

// Check environment variables
logger.info('📋 Environment Variables:');
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
    logger.info(`   ✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    logger.info(`   ❌ ${varName}: MISSING`);
  }
});

logger.info('\n🔍 NextAuth Configuration Issues:');

// Check NEXTAUTH_URL format
const nextAuthUrl = process.env.NEXTAUTH_URL;
if (nextAuthUrl) {
  logger.info(`   NEXTAUTH_URL: ${nextAuthUrl}`);
  
  // Check if URL has correct format
  try {
    const url = new URL(nextAuthUrl);
    logger.info(`   ✅ Valid URL format`);
    logger.info(`   Protocol: ${url.protocol}`);
    logger.info(`   Host: ${url.host}`);
    logger.info(`   Port: ${url.port || 'default'}`);
  } catch (e) {
    logger.info(`   ❌ Invalid URL format: ${e.message}`);
  }
} else {
  logger.info('   ❌ NEXTAUTH_URL not set');
}

// Check if we're in production vs development
logger.info('\n🔍 Environment Detection:');
logger.info(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
logger.info(`   PORT: ${process.env.PORT || 'undefined'}`);

// Check Next.js configuration
logger.info('\n🔍 Next.js Configuration:');
const fs = require('fs');
const path = require('path');

try {
  const nextConfigPath = path.join(__dirname, '../next.config.js');
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (nextConfig.includes('output: \'standalone\'')) {
    logger.info('   ⚠️  Standalone output detected - this affects how the app starts');
    logger.info('   💡 For standalone, use: node .next/standalone/server.js');
    logger.info('   💡 For regular, use: next start');
  }
  
  if (nextConfig.includes('serverActions')) {
    logger.info('   ✅ Server Actions configured');
  }
} catch (e) {
  logger.info(`   ❌ Could not read next.config.js: ${e.message}`);
}

// Check if NextAuth route exists and is valid
logger.info('\n🔍 NextAuth Route Check:');
const nextAuthRoutePath = path.join(__dirname, '../app/api/auth/[...nextauth]/route.js');
try {
  const nextAuthRoute = fs.readFileSync(nextAuthRoutePath, 'utf8');
  
  if (nextAuthRoute.includes('export { handler as GET, handler as POST }')) {
    logger.info('   ✅ NextAuth route exports GET and POST handlers');
  } else {
    logger.info('   ❌ NextAuth route missing GET/POST exports');
  }
  
  if (nextAuthRoute.includes('GoogleProvider')) {
    logger.info('   ✅ GoogleProvider configured');
  } else {
    logger.info('   ❌ GoogleProvider not found');
  }
  
  if (nextAuthRoute.includes('authOptions')) {
    logger.info('   ✅ authOptions defined');
  } else {
    logger.info('   ❌ authOptions not found');
  }
  
} catch (e) {
  logger.info(`   ❌ Could not read NextAuth route: ${e.message}`);
}

// Check package.json scripts
logger.info('\n🔍 Package.json Scripts:');
try {
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  logger.info('   Available scripts:');
  Object.keys(packageJson.scripts).forEach(script => {
    logger.info(`     ${script}: ${packageJson.scripts[script]}`);
  });
  
} catch (e) {
  logger.info(`   ❌ Could not read package.json: ${e.message}`);
}

logger.info('\n🎯 Common 405 Error Causes:');
logger.info('   1. ❌ Missing GET/POST exports in NextAuth route');
logger.info('   2. ❌ Incorrect NEXTAUTH_URL configuration');
logger.info('   3. ❌ Wrong port configuration');
logger.info('   4. ❌ Standalone output with wrong start command');
logger.info('   5. ❌ Missing environment variables');
logger.info('   6. ❌ CORS issues');
logger.info('   7. ❌ NextAuth configuration errors');

logger.info('\n💡 Recommended Fixes:');
logger.info('   1. Ensure NEXTAUTH_URL matches your actual domain/port');
logger.info('   2. For production: NEXTAUTH_URL=https://cosmicspiritguide.com');
logger.info('   3. For development: NEXTAUTH_URL=http://localhost:5000');
logger.info('   4. Use correct start command based on output config');
logger.info('   5. Verify all environment variables are set in Render');





