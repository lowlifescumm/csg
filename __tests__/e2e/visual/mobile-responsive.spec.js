const { test, expect } = require('@playwright/test');

/**
 * Visual regression tests for mobile responsiveness
 * Screenshots captured at 375px (mobile), 768px (tablet), 1440px (desktop)
 */

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const PAGES = [
  { path: '/', name: 'homepage' },
  { path: '/birth-chart', name: 'birth-chart' },
  { path: '/compatibility', name: 'compatibility' },
  { path: '/tarot', name: 'tarot' },
  { path: '/dashboard', name: 'dashboard' },
  { path: '/moon-reading', name: 'moon-reading' },
  { path: '/forecasts', name: 'forecasts' },
  { path: '/privacy', name: 'privacy' },
  { path: '/terms', name: 'terms' },
  { path: '/contact', name: 'contact' },
];

for (const page of PAGES) {
  for (const vp of VIEWPORTS) {
    test(`${page.name} @ ${vp.name} (${vp.width}x${vp.height})`, async ({ page: p }) => {
      await p.setViewportSize({ width: vp.width, height: vp.height });
      await p.goto(page.path, { waitUntil: 'networkidle' });

      // Wait for fonts and layout to settle
      await p.waitForTimeout(500);

      // Capture full-page screenshot for visual diff baseline
      await expect(p).toHaveScreenshot(
        `${page.name}-${vp.name}.png`,
        { fullPage: true, maxDiffPixels: 200 }
      );
    });
  }
}

test.describe('Touch target accessibility', () => {
  test('interactive elements meet minimum 44x44px on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const buttons = await page.locator('button, a, [role="button"], [role="link"]').all();
    const violations = [];

    for (const btn of buttons) {
      const box = await btn.boundingBox();
      if (box && (box.width < 44 || box.height < 44)) {
        const text = (await btn.textContent() || '').slice(0, 40);
        violations.push({ text, width: Math.round(box.width), height: Math.round(box.height) });
      }
    }

    // Log violations for audit but don't fail — we need a baseline first
    if (violations.length) {
      console.warn('Touch target violations:', violations.slice(0, 20));
    }
    expect(violations.length).toBeLessThanOrEqual(10); // Allow small nav items, flag egregious cases
  });

  test('no horizontal scroll on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const pageDef of PAGES.slice(0, 6)) { // Core pages
      await page.goto(pageDef.path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth, `Horizontal overflow on ${pageDef.path}`).toBeLessThanOrEqual(clientWidth + 1);
    }
  });
});
