const logger = require('./lib/logger');
/**
 * Acceptance test for renderFromTemplate
 * Verifies it returns HTML string with sampleData injected into placeholders
 */

import { renderFromTemplate } from '../lib/template-renderer.js';

// Sample template (HTML format)
const sampleTemplate = {
  html: `
    <div class="report">
      <h1>{{userName}}'s Astrology Report</h1>
      <div class="chart">
        <h2>Your Sun Sign: {{userSunSign}}</h2>
        <p>{{forecastText}}</p>
      </div>
      <footer>Generated: {{generatedAt}}</footer>
    </div>
  `,
  styles: `
    .report { max-width: 800px; margin: 0 auto; }
    h1 { color: #1a1a1a; }
    .chart { background: #f5f5f5; padding: 1em; }
  `,
};

// Sample data
const sampleData = {
  userName: 'John Doe',
  userSunSign: 'Leo',
  forecastText: 'The stars align for new opportunities this month.',
  generatedAt: 'January 15, 2025',
};

logger.info('🧪 Acceptance Test: renderFromTemplate\n');

try {
  const result = renderFromTemplate(sampleTemplate, sampleData);
  
  // Acceptance criteria checks
  logger.info('✅ Function executed without errors');
  
  // Check 1: Returns HTML string
  if (typeof result === 'string') {
    logger.info('✅ Returns HTML string');
  } else {
    logger.error('❌ Does not return string');
    process.exit(1);
  }
  
  // Check 2: Contains injected data
  const checks = [
    { key: 'userName', value: 'John Doe' },
    { key: 'userSunSign', value: 'Leo' },
    { key: 'forecastText', value: 'stars align' },
    { key: 'generatedAt', value: 'January 15, 2025' },
  ];
  
  let allPassed = true;
  checks.forEach(check => {
    if (result.includes(check.value)) {
      logger.info(`✅ Contains ${check.key}: "${check.value}"`);
    } else {
      logger.error(`❌ Missing ${check.key}: "${check.value}"`);
      allPassed = false;
    }
  });
  
  if (!allPassed) {
    process.exit(1);
  }
  
  // Check 3: Contains full HTML structure
  if (result.includes('<!doctype html>') || result.includes('<html')) {
    logger.info('✅ Contains full HTML document structure');
  } else {
    logger.error('❌ Missing HTML document structure');
    process.exit(1);
  }
  
  // Check 4: Contains inline CSS
  if (result.includes('<style>') || result.includes('font-family')) {
    logger.info('✅ Contains inline CSS and fonts');
  } else {
    logger.error('❌ Missing inline CSS');
    process.exit(1);
  }
  
  // Check 5: Ready for Puppeteer (has meta tags)
  if (result.includes('<meta charset') || result.includes('charset=')) {
    logger.info('✅ Contains meta tags for Puppeteer compatibility');
  } else {
    logger.warn('⚠️  Missing meta tags (may still work)');
  }
  
  logger.info('\n✨ Acceptance test PASSED!');
  logger.info(`\n📄 Generated HTML (first 500 chars):\n${result.substring(0, 500)}...\n`);
  
} catch (error) {
  logger.error('❌ Acceptance test FAILED:', error.message);
  logger.error(error);
  process.exit(1);
}

