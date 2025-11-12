#!/usr/bin/env node

const PROD_URL = 'https://cosmicspiritguide.com';

async function checkDashboardVariant(url, description) {
  try {
    const response = await fetch(url, { method: 'GET' });
    const status = response.status;
    const html = await response.text();
    
    // Check for DashboardV3 indicators
    const hasV3 = html.includes('DashboardV3') || 
                  html.includes('cosmic journey') || 
                  html.includes('Loading your cosmic journey');
    
    // Check for legacy dashboard indicators
    const hasLegacy = html.includes('DashboardPageContent') ||
                      html.includes('InteractiveTarotSelector') ||
                      html.includes('HelpSystem');
    
    const variant = hasV3 ? 'DashboardV3' : hasLegacy ? 'Legacy' : 'Unknown';
    
    console.log(`${status === 200 ? '✅' : '❌'} ${description}`);
    console.log(`   URL: ${url}`);
    console.log(`   Status: ${status}`);
    console.log(`   Variant: ${variant}`);
    console.log('');
    
    return { status, variant, url, description };
  } catch (error) {
    console.error(`❌ ${description} - ERROR: ${error.message}`);
    return { status: 'ERROR', variant: 'Unknown', url, description, error: error.message };
  }
}

async function main() {
  console.log('\n🔍 Verifying Dashboard Overlay Toggle\n');
  console.log('='.repeat(60));
  console.log('');
  
  const results = [];
  
  // Test 1: Default (should be legacy)
  results.push(await checkDashboardVariant(
    `${PROD_URL}/dashboard`,
    'Default Dashboard (no flag, no invite)'
  ));
  
  // Test 2: With invite token (if DASHBOARD_V3_INVITE is set, this would work)
  // Note: This will only work if DASHBOARD_V3_INVITE is configured
  const testInvite = process.env.TEST_INVITE_TOKEN || 'test-token-123';
  results.push(await checkDashboardVariant(
    `${PROD_URL}/dashboard?v3_invite=${testInvite}`,
    `Dashboard with invite token (${testInvite})`
  ));
  
  console.log('='.repeat(60));
  console.log('\n📊 Summary\n');
  
  const legacyCount = results.filter(r => r.variant === 'Legacy').length;
  const v3Count = results.filter(r => r.variant === 'DashboardV3').length;
  
  console.log(`Legacy Dashboard: ${legacyCount} test(s)`);
  console.log(`DashboardV3: ${v3Count} test(s)`);
  console.log(`Unknown: ${results.filter(r => r.variant === 'Unknown').length} test(s)`);
  
  console.log('\n📝 Notes:');
  console.log('- If DASHBOARD_V3=true is set in Render, both tests may show DashboardV3');
  console.log('- If DASHBOARD_V3_INVITE is set, invite token test will show DashboardV3');
  console.log('- Default behavior (no flags) should show Legacy dashboard');
  console.log('- See docs/OVERLAY_VERIFICATION.md for full testing guide\n');
  
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

