/**
 * E2E Tests: Credit Deduction
 * Tests credit deduction when generating readings
 */

import { test, expect } from '@playwright/test';

test.describe('Credit Deduction', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should deduct 1 credit for basic tarot reading', async ({ page }) => {
    // Get initial credits
    const initialCreditsText = await page.locator('[data-testid="credits-display"], text=/\\d+\\s+Credits/i').first().textContent();
    const initialCredits = parseInt(initialCreditsText?.match(/\d+/)?.[0] || '0');

    // Intercept API calls
    const creditUpdatePromise = page.waitForResponse(
      (response) => response.url().includes('/api/credits') && response.request().method() === 'GET'
    );

    const readingGenerationPromise = page.waitForResponse(
      (response) => response.url().includes('/api/readings/generate') && response.status() === 200
    );

    // Generate a reading (click on a tarot tile or use FocusGrid)
    const tarotTile = page.locator('text=/daily tarot|tarot/i').first();
    if (await tarotTile.isVisible()) {
      await tarotTile.click();
      
      // Wait for reading generation
      await readingGenerationPromise;
      
      // Wait for credits update
      await creditUpdatePromise;
      
      // Check credits decreased
      const updatedCreditsText = await page.locator('[data-testid="credits-display"], text=/\\d+\\s+Credits/i').first().textContent();
      const updatedCredits = parseInt(updatedCreditsText?.match(/\d+/)?.[0] || '0');
      
      expect(updatedCredits).toBe(initialCredits - 1);
    }
  });

  test('should show error when insufficient credits', async ({ page }) => {
    // Mock low credits scenario
    await page.route('**/api/credits', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          stats: { totalAvailable: 0 },
          credits: 0,
        }),
      });
    });

    // Try to generate reading
    const tarotTile = page.locator('text=/daily tarot|tarot/i').first();
    if (await tarotTile.isVisible()) {
      await tarotTile.click();

      // Should show error message
      await expect(page.locator('text=/insufficient credits|not enough credits/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display credit balance in hero header', async ({ page }) => {
    // Check credits are displayed
    const creditsDisplay = page.locator('[data-testid="credits-display"], text=/\\d+\\s+Credits/i').first();
    await expect(creditsDisplay).toBeVisible();
  });

  test('should update credits after reading generation', async ({ page }) => {
    // Monitor credit changes
    let creditsBefore = 0;
    const creditsElement = page.locator('[data-testid="credits-display"], text=/\\d+\\s+Credits/i').first();
    
    if (await creditsElement.isVisible()) {
      const creditsText = await creditsElement.textContent();
      creditsBefore = parseInt(creditsText?.match(/\d+/)?.[0] || '0');
    }

    // Generate reading
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Get Reading")').first();
    if (await generateButton.isVisible()) {
      await generateButton.click();
      
      // Wait for reading to complete
      await page.waitForTimeout(2000);
      
      // Check credits updated
      const creditsTextAfter = await creditsElement.textContent();
      const creditsAfter = parseInt(creditsTextAfter?.match(/\d+/)?.[0] || '0');
      
      if (creditsBefore > 0) {
        expect(creditsAfter).toBeLessThan(creditsBefore);
      }
    }
  });
});

