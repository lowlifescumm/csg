/**
 * Visual Regression Tests
 * Capture screenshots at 375px, 768px, and 1440px for key pages.
 * Run with: npx playwright test --project=visual-regression
 */
import { test, expect } from '@playwright/test';

const keyRoutes = [
  { path: '/', name: 'homepage' },
  { path: '/birth-chart', name: 'birth-chart' },
  { path: '/compatibility', name: 'compatibility' },
  { path: '/dashboard', name: 'dashboard' },
  { path: '/moon-phase', name: 'moon-phase' },
  { path: '/forecasts', name: 'forecasts' },
  { path: '/pricing', name: 'pricing' },
  { path: '/login', name: 'login' },
];

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const route of keyRoutes) {
  for (const vp of viewports) {
    test(`${route.name} @ ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(route.path, { waitUntil: 'load' });

      // Wait for network idle to reduce flaky captures
      await page.waitForLoadState('networkidle');

      // Optional: dismiss any cookie banners / modals that block layout
      const cookieAccept = page.locator('button:has-text("Accept"), button:has-text("Got it"), [data-testid="cookie-accept"]').first();
      if (await cookieAccept.isVisible().catch(() => false)) {
        await cookieAccept.click();
      }

      // Full-page screenshot for diff comparison
      await expect(page).toHaveScreenshot(`${route.name}-${vp.name}.png`, {
        fullPage: true,
        maxDiffPixels: 50,
      });
    });
  }
}

// Touch-target size audit
for (const route of keyRoutes) {
  test(`touch-target audit: ${route.name} @ mobile`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route.path, { waitUntil: 'load' });
    await page.waitForLoadState('networkidle');

    const elements = await page.locator('button, a, [role="button"], input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
    const violations = [];

    for (const el of elements) {
      const box = await el.boundingBox();
      if (!box) continue;
      if (box.width < 44 || box.height < 44) {
        const tag = await el.evaluate((node) => node.tagName.toLowerCase());
        const text = await el.textContent().catch(() => '');
        violations.push({
          tag,
          text: text.trim().slice(0, 40),
          width: Math.round(box.width),
          height: Math.round(box.height),
        });
      }
    }

    if (violations.length > 0) {
      console.warn('Touch-target violations:', JSON.stringify(violations.slice(0, 20), null, 2));
    }

    // Fail test if any touch target is smaller than 44x44px
    expect(violations, `Found ${violations.length} touch targets smaller than 44x44px`).toHaveLength(0);
  });
}

// Horizontal-scroll audit
for (const route of keyRoutes) {
  test(`no horizontal scroll: ${route.name} @ mobile`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route.path, { waitUntil: 'load' });
    await page.waitForLoadState('networkidle');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth, `Horizontal overflow detected: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`).toBeLessThanOrEqual(clientWidth);
  });
}
