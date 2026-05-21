#!/usr/bin/env node
/**
 * Automated accessibility audit using Playwright + axe-core (injected)
 * Runs against key pages and reports WCAG AA violations.
 *
 * Usage:
 *   npm run test:a11y              # tests against local dev server on :5000
 *   BASE_URL=http://localhost:3000 npm run test:a11y  # custom base URL
 */

const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000';

const PAGES = [
  { path: '/', name: 'homepage' },
  { path: '/birth-chart', name: 'birth-chart' },
  { path: '/compatibility', name: 'compatibility' },
  { path: '/contact', name: 'contact' },
  { path: '/privacy', name: 'privacy' },
  { path: '/terms', name: 'terms' },
];

// Inject axe-core from CDN for lightweight testing
async function injectAxe(page) {
  await page.addScriptTag({
    url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js',
  });
}

async function runAudit() {
  console.log('\n🧪 axe-core accessibility audit (Playwright + axe-core)');
  console.log('   Base URL: ' + BASE_URL);
  console.log('   Rules: wcag2a, wcag2aa, wcag21aa\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let totalViolations = 0;
  let hasErrors = false;

  for (const pageDef of PAGES) {
    const url = BASE_URL + pageDef.path;
    console.log('▶ ' + pageDef.name + ' (' + url + ')');

    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      await injectAxe(page);

      const results = await page.evaluate(() => {
        return new Promise((resolve) => {
          window.axe.run(document, {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21aa'],
            },
          }, (err, results) => {
            if (err) resolve({ error: err.message });
            else resolve(results);
          });
        });
      });

      if (results.error) {
        console.log('  ⚠️  axe-core error: ' + results.error + '\n');
        hasErrors = true;
        continue;
      }

      const violations = results.violations || [];
      const critical = violations.filter(v => v.impact === 'critical');
      const serious = violations.filter(v => v.impact === 'serious');
      const moderate = violations.filter(v => v.impact === 'moderate');
      const minor = violations.filter(v => v.impact === 'minor');

      const pageTotal = violations.length;
      totalViolations += pageTotal;

      if (pageTotal === 0) {
        console.log('  ✅ No violations\n');
      } else {
        console.log('  ⚠️  ' + pageTotal + ' violations (' + critical.length + ' critical, ' + serious.length + ' serious, ' + moderate.length + ' moderate, ' + minor.length + ' minor)');
        for (const v of violations) {
          console.log('    • [' + v.impact.toUpperCase() + '] ' + v.id + ': ' + v.help + ' (' + v.nodes.length + ' nodes)');
        }
        console.log('');
      }
    } catch (err) {
      if (err.message && err.message.includes('ECONNREFUSED')) {
        console.error('  ❌ ERROR: Could not reach ' + url + '. Is the dev server running? (npm run dev)\n');
      } else {
        console.error('  ❌ ERROR: ' + err.message + '\n');
      }
      hasErrors = true;
    }
  }

  await browser.close();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Total violations across all pages: ' + totalViolations);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (hasErrors) {
    console.error('Some pages could not be tested (server unreachable or axe error).');
    console.error('Start the dev server with: npm run dev');
    process.exit(1);
  }

  if (totalViolations > 0) {
    console.log('Fix violations above. Failing on WCAG AA violations per acceptance criteria.');
    process.exit(1);
  }

  console.log('✅ All pages pass WCAG AA accessibility audit.\n');
  process.exit(0);
}

runAudit().catch((err) => {
  console.error('Fatal error running audit:', err);
  process.exit(1);
});
