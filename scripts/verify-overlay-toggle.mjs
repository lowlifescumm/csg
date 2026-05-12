const logger = require('./lib/logger');
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
    
    logger.info(`${status === 200 ? '✅' : '❌'} ${description}`);
    logger.info(`   URL: ${url}`);
    logger.info(`   Status: ${status}`);
    logger.info(`   Variant: ${variant}`);
    logger.info('');
    
    return { status, variant, url, description };
  } catch (error) {
    logger.error(`❌ ${description} - ERROR: ${error.message}`);
    return { status: 'ERROR', variant: 'Unknown', url, description, error: error.message };
  }
}

async function main() {
  logger.info('\n🔍 Verifying Dashboard Overlay Toggle\n');
  logger.info('='.repeat(60));
  logger.info('');
  
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
  
  logger.info('='.repeat(60));
  logger.info('\n📊 Summary\n');
  
  const legacyCount = results.filter(r => r.variant === 'Legacy').length;
  const v3Count = results.filter(r => r.variant === 'DashboardV3').length;
  
  logger.info(`Legacy Dashboard: ${legacyCount} test(s)`);
  logger.info(`DashboardV3: ${v3Count} test(s)`);
  logger.info(`Unknown: ${results.filter(r => r.variant === 'Unknown').length} test(s)`);
  
  logger.info('\n📝 Notes:');
  logger.info('- If DASHBOARD_V3=true is set in Render, both tests may show DashboardV3');
  logger.info('- If DASHBOARD_V3_INVITE is set, invite token test will show DashboardV3');
  logger.info('- Default behavior (no flags) should show Legacy dashboard');
  logger.info('- See docs/OVERLAY_VERIFICATION.md for full testing guide\n');
  
  process.exit(0);
}

main().catch(error => {
  logger.error('Fatal error:', error);
  process.exit(1);
});


