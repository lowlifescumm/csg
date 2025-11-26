// Test Google OAuth configuration
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

function testGoogleOAuthConfig() {
  console.log('🔍 Testing Google OAuth Configuration...\n');
  
  const checks = [];
  
  // Check GOOGLE_CLIENT_ID
  if (process.env.GOOGLE_CLIENT_ID) {
    console.log('✅ GOOGLE_CLIENT_ID is set');
    console.log(`   Value: ${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...`);
    checks.push(true);
  } else {
    console.log('❌ GOOGLE_CLIENT_ID is NOT set');
    checks.push(false);
  }
  
  // Check GOOGLE_CLIENT_SECRET
  if (process.env.GOOGLE_CLIENT_SECRET) {
    console.log('✅ GOOGLE_CLIENT_SECRET is set');
    console.log(`   Value: ${process.env.GOOGLE_CLIENT_SECRET.substring(0, 10)}...`);
    checks.push(true);
  } else {
    console.log('❌ GOOGLE_CLIENT_SECRET is NOT set');
    checks.push(false);
  }
  
  // Check NEXTAUTH_URL
  if (process.env.NEXTAUTH_URL) {
    console.log('✅ NEXTAUTH_URL is set');
    console.log(`   Value: ${process.env.NEXTAUTH_URL}`);
    
    // Check redirect URI
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/google`;
    console.log(`   Expected redirect URI: ${redirectUri}`);
    checks.push(true);
  } else {
    console.log('❌ NEXTAUTH_URL is NOT set');
    checks.push(false);
  }
  
  // Check NEXTAUTH_SECRET
  if (process.env.NEXTAUTH_SECRET) {
    console.log('✅ NEXTAUTH_SECRET is set');
    console.log(`   Length: ${process.env.NEXTAUTH_SECRET.length} characters`);
    checks.push(true);
  } else {
    console.log('❌ NEXTAUTH_SECRET is NOT set');
    checks.push(false);
  }
  
  // Check JWT_SECRET
  if (process.env.JWT_SECRET) {
    console.log('✅ JWT_SECRET is set (for session token compatibility)');
    checks.push(true);
  } else {
    console.log('❌ JWT_SECRET is NOT set');
    checks.push(false);
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (checks.every(check => check)) {
    console.log('\n✅ All Google OAuth configuration checks passed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Verify your Google Cloud Console settings:');
    console.log('      • Go to https://console.cloud.google.com/apis/credentials');
    console.log('      • Make sure Authorized redirect URIs includes:');
    console.log(`        ${process.env.NEXTAUTH_URL}/api/auth/callback/google`);
    console.log('   2. Restart your development server');
    console.log('   3. Test the Google Sign-In button at /login');
    console.log('\n🎉 Google OAuth should be working now!');
  } else {
    console.log('\n⚠️  Some configuration checks failed!');
    console.log('   Please fix the issues above and try again.');
  }
}

testGoogleOAuthConfig();






