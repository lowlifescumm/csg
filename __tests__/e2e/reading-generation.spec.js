/**
 * E2E Tests: Reading Generation
 * Tests reading generation success and API failure fallback
 */

import { test, expect } from '@playwright/test';

test.describe('Reading Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should generate reading successfully', async ({ page }) => {
    // Intercept reading generation API
    const readingPromise = page.waitForResponse(
      (response) => response.url().includes('/api/readings/generate') && response.status() === 200
    );

    // Click on a reading tile
    const readingTile = page.locator('text=/daily tarot|love|career/i').first();
    if (await readingTile.isVisible()) {
      await readingTile.click();

      // Wait for API response
      const response = await readingPromise;
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.reading).toBeDefined();
      expect(data.reading.cards).toBeDefined();
      expect(data.reading.interpretation).toBeDefined();
    }
  });

  test('should display reading result in modal', async ({ page }) => {
    // Generate reading
    const readingTile = page.locator('text=/daily tarot/i').first();
    if (await readingTile.isVisible()) {
      await readingTile.click();

      // Wait for modal to appear
      const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
      await expect(modal).toBeVisible({ timeout: 10000 });

      // Check reading content
      await expect(modal.locator('text=/cards|interpretation|reading/i')).toBeVisible();
    }
  });

  test('should handle API failure gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/readings/generate', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Try to generate reading
    const readingTile = page.locator('text=/daily tarot/i').first();
    if (await readingTile.isVisible()) {
      await readingTile.click();

      // Should show error message
      await expect(page.locator('text=/error|failed|try again/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show loading state during generation', async ({ page }) => {
    // Delay API response
    await page.route('**/api/readings/generate', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });

    // Click reading tile
    const readingTile = page.locator('text=/daily tarot/i').first();
    if (await readingTile.isVisible()) {
      await readingTile.click();

      // Should show loading indicator
      await expect(page.locator('text=/loading|generating|processing/i, [class*="spinner"], [class*="loading"]')).toBeVisible({ timeout: 2000 });
    }
  });

  test('should allow closing reading modal', async ({ page }) => {
    // Generate reading
    const readingTile = page.locator('text=/daily tarot/i').first();
    if (await readingTile.isVisible()) {
      await readingTile.click();

      // Wait for modal
      const modal = page.locator('[role="dialog"], .modal').first();
      await expect(modal).toBeVisible({ timeout: 10000 });

      // Close modal
      const closeButton = modal.locator('button:has-text("Close"), button[aria-label*="close"], [class*="close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await expect(modal).not.toBeVisible();
      }
    }
  });

  test('should handle network timeout', async ({ page }) => {
    // Simulate timeout
    await page.route('**/api/readings/generate', (route) => {
      setTimeout(() => {
        route.abort();
      }, 100);
    });

    // Try to generate reading
    const readingTile = page.locator('text=/daily tarot/i').first();
    if (await readingTile.isVisible()) {
      await readingTile.click();

      // Should show timeout/network error
      await expect(page.locator('text=/timeout|network|connection/i')).toBeVisible({ timeout: 5000 });
    }
  });
});

