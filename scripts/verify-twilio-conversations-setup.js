/**
 * Verify Twilio Conversations Service Setup
 * 
 * This script checks that all required Twilio Conversations environment variables are set.
 * 
 * Usage: node scripts/verify-twilio-conversations-setup.js
 */

const requiredEnvVars = [
  'TWILIO_CONVERSATIONS_SERVICE_SID',
  'TWILIO_API_KEY_SID',
  'TWILIO_API_SECRET'
];

function verifySetup() {
  console.log('\n🔍 Verifying Twilio Conversations Service Setup\n');
  
  const missing = [];
  const configured = [];
  
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    
    if (!value || value.trim() === '') {
      missing.push(varName);
      console.log(`❌ ${varName}: Not set`);
    } else {
      // Mask sensitive values for display
      const displayValue = varName.includes('SECRET') 
        ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}` 
        : value;
      
      configured.push(varName);
      console.log(`✅ ${varName}: ${displayValue}`);
    }
  });
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  if (missing.length === 0) {
    console.log('✅ All Twilio Conversations environment variables are configured!');
    console.log('\n📋 Summary:');
    console.log(`   - Service SID: ${process.env.TWILIO_CONVERSATIONS_SERVICE_SID}`);
    console.log(`   - API Key SID: ${process.env.TWILIO_API_KEY_SID}`);
    console.log(`   - API Secret: ${process.env.TWILIO_API_SECRET.substring(0, 8)}...${process.env.TWILIO_API_SECRET.substring(process.env.TWILIO_API_SECRET.length - 4)}`);
    
    // Validate format
    const serviceSid = process.env.TWILIO_CONVERSATIONS_SERVICE_SID;
    const apiKeySid = process.env.TWILIO_API_KEY_SID;
    
    if (!serviceSid.startsWith('IS')) {
      console.log('\n⚠️  Warning: Service SID should start with "IS"');
    }
    
    if (!apiKeySid.startsWith('SK')) {
      console.log('\n⚠️  Warning: API Key SID should start with "SK"');
    }
    
    console.log('\n✅ Setup verification complete!\n');
    process.exit(0);
  } else {
    console.log('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n📖 Please refer to docs/TWILIO_CONVERSATIONS_SETUP.md for setup instructions.\n');
    process.exit(1);
  }
}

// Run verification
verifySetup();

