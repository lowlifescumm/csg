const logger = require('./lib/logger');
// Test Google OAuth configuration
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

function testGoogleOAuthConfig() {
  logger.info('🔍 Testing Google OAuth Configuration...\n');
  
  const checks = [];
  
  // Check GOOGLE_CLIENT_ID
  if (process.env.GOOGLE_CLIENT_ID) {
    logger.info('✅ GOOGLE_CLIENT_ID is set');
    logger.info(`   Value: ${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...`);
    checks.push(true);
  } else {
    logger.info('❌ GOOGLE_CLIENT_ID is NOT set');
    checks.push(false);
  }
  
  // Check GOOGLE_CLIENT_SECRET
  if (process.env.GOOGLE_CLIENT_SECRET) {
    logger.info('✅ GOOGLE_CLIENT_SECRET is set');
    logger.info(`   Value: ${process.env.GOOGLE_CLIENT_SECRET.substring(0, 10)}...`);
    checks.push(true);
  } else {
    logger.info('❌ GOOGLE_CLIENT_SECRET is NOT set');
    checks.push(false);
  }
  
  // Check NEXTAUTH_URL
  if (process.env.NEXTAUTH_URL) {
    logger.info('✅ NEXTAUTH_URL is set');
    logger.info(`   Value: ${process.env.NEXTAUTH_URL}`);
    
    // Check redirect URI
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/google`;
    logger.info(`   Expected redirect URI: ${redirectUri}`);
    checks.push(true);
  } else {
    logger.info('❌ NEXTAUTH_URL is NOT set');
    checks.push(false);
  }
  
  // Check NEXTAUTH_SECRET
  if (process.env.NEXTAUTH_SECRET) {
    logger.info('✅ NEXTAUTH_SECRET is set');
    logger.info(`   Length: ${process.env.NEXTAUTH_SECRET.length} characters`);
    checks.push(true);
  } else {
    logger.info('❌ NEXTAUTH_SECRET is NOT set');
    checks.push(false);
  }
  
  // Check JWT_SECRET
  if (process.env.JWT_SECRET) {
    logger.info('✅ JWT_SECRET is set (for session token compatibility)');
    checks.push(true);
  } else {
    logger.info('❌ JWT_SECRET is NOT set');
    checks.push(false);
  }
  
  logger.info('\n' + '='.repeat(60));
  
  if (checks.every(check => check)) {
    logger.info('\n✅ All Google OAuth configuration checks passed!');
    logger.info('\n📋 Next steps:');
    logger.info('   1. Verify your Google Cloud Console settings:');
    logger.info('      • Go to https://console.cloud.google.com/apis/credentials');
    logger.info('      • Make sure Authorized redirect URIs includes:');
    logger.info(`        ${process.env.NEXTAUTH_URL}/api/auth/callback/google`);
    logger.info('   2. Restart your development server');
    logger.info('   3. Test the Google Sign-In button at /login');
    logger.info('\n🎉 Google OAuth should be working now!');
  } else {
    logger.info('\n⚠️  Some configuration checks failed!');
    logger.info('   Please fix the issues above and try again.');
  }
}

testGoogleOAuthConfig();






