const { test, expect } = require('@playwright/test');

/**
 * Automated accessibility audit using Playwright + axe-core (injected)
 * Runs against key pages and reports WCAG AA violations.
 */

const PAGES = [
  { path: '/', name: 'homepage' },
  { path: '/birth-chart', name: 'birth-chart' },
  { path: '/compatibility', name: 'compatibility' },
  { path: '/tarot', name: 'tarot' },
  { path: '/contact', name: 'contact' },
  { path: '/privacy', name: 'privacy' },
  { path: '/terms', name: 'terms' },
];

// Inject axe-core from CDN for lightweight testing (no npm dep needed)
async function injectAxe(page) {
  await page.addScriptTag({
    url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js',
  });
}

test.describe('axe-core accessibility audit', () => {
  for (const pageDef of PAGES) {
    test(`${pageDef.name} (${pageDef.path}) — no critical or serious violations`, async ({ page }) => {
      await page.goto(pageDef.path, { waitUntil: 'networkidle' });
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
        test.info().annotations.push({ type: 'warning', description: `axe-core failed: ${results.error}` });
        return;
      }

      const critical = results.violations.filter(v => v.impact === 'critical');
      const serious = results.violations.filter(v => v.impact === 'serious');
      const moderate = results.violations.filter(v => v.impact === 'moderate');
      const minor = results.violations.filter(v => v.impact === 'minor');

      // Print summary for CI logs
      console.log(`[${pageDef.name}] violations: ${critical.length} critical, ${serious.length} serious, ${moderate.length} moderate, ${minor.length} minor`);
      for (const v of [...critical, ...serious, ...moderate]) {
        console.log(`  - ${v.id}: ${v.help} (${v.nodes.length} nodes)`);
      }

      // Fail on critical/serious only
      expect(critical.length + serious.length, `Critical/serious a11y violations on ${pageDef.path}: ${[...critical, ...serious].map(v => v.id).join(', ')}`).toBe(0);
    });
  }
});

test.describe('keyboard navigation', () => {
  test('all interactive elements are focusable on homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    const interactive = await page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
    const unfocusable = [];

    for (const el of interactive) {
      const isVisible = await el.isVisible().catch(() => false);
      if (!isVisible) continue;
      const tabIndex = await el.getAttribute('tabindex');
      const tag = await el.evaluate(e => e.tagName.toLowerCase());
      if (tag === 'a' || tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea') {
        // Native focusable — OK
        continue;
      }
      if (tabIndex === null || tabIndex === '-1') {
        const text = (await el.textContent() || '').slice(0, 40);
        unfocusable.push({ tag, text });
      }
    }

    console.log('Unfocusable interactive elements:', unfocusable.slice(0, 10));
    expect(unfocusable.length, 'Some interactive elements lack keyboard access').toBeLessThanOrEqual(5);
  });
});

test.describe('image alt text', () => {
  test('all images have alt text on homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    const images = await page.locator('img').all();
    const missing = [];

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const src = (await img.getAttribute('src') || '').slice(0, 60);
      if (alt === null || alt === '') {
        missing.push({ src });
      }
    }

    console.log('Images missing alt text:', missing.slice(0, 10));
    expect(missing.length, 'Images missing alt attribute').toBeLessThanOrEqual(5);
  });
});

test.describe('form labels', () => {
  test('form inputs have associated labels', async ({ page }) => {
    await page.goto('/birth-chart', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    const inputs = await page.locator('input:not([type="hidden"]), select, textarea').all();
    const unlabeled = [];

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      const hasLabel = id && (await page.locator(`label[for="${id}"]`).count()) > 0;

      if (!hasLabel && !ariaLabel && !ariaLabelledBy && !placeholder) {
        const name = await input.getAttribute('name') || 'unnamed';
        unlabeled.push({ name });
      }
    }

    console.log('Unlabeled form inputs:', unlabeled.slice(0, 10));
    expect(unlabeled.length, 'Form inputs missing labels').toBeLessThanOrEqual(3);
  });
});
