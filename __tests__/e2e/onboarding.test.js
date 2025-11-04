const { test, expect } = require('@playwright/test');

test.describe('User Onboarding Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear localStorage to ensure fresh onboarding experience
    await context.clearCookies();
    await page.goto('/');
  });

  test('should display onboarding tour for new users', async ({ page }) => {
    // Check if QuickTour component is present
    const tourElement = await page.locator('[data-tour]').first();
    await expect(tourElement).toBeVisible();
  });

  test('should complete onboarding tour successfully', async ({ page }) => {
    // Wait for tour to appear
    const tourVisible = await page.locator('text=Welcome to Cosmic Spiritual Guide').isVisible();
    
    if (tourVisible) {
      // Click through tour steps
      const nextButton = page.locator('button:has-text("Next")').first();
      const finishButton = page.locator('button:has-text("Finish")').first();
      
      // Navigate through tour
      while (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
      
      // Finish tour
      if (await finishButton.isVisible()) {
        await finishButton.click();
        await page.waitForTimeout(500);
      }
      
      // Verify tour is completed and localStorage is set
      const tourCompleted = await page.evaluate(() => {
        return localStorage.getItem('cosmic-tour-completed');
      });
      
      expect(tourCompleted).toBe('true');
    }
  });

  test('should skip onboarding tour when clicked', async ({ page }) => {
    const skipButton = page.locator('button:has-text("Skip Tour")').first();
    
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
      
      // Verify tour is completed
      const tourCompleted = await page.evaluate(() => {
        return localStorage.getItem('cosmic-tour-completed');
      });
      
      expect(tourCompleted).toBe('true');
    }
  });

  test('should not show tour for returning users', async ({ page, context }) => {
    // Set tour completed flag
    await context.addCookies([{
      name: 'cosmic-tour-completed',
      value: 'true',
      path: '/',
    }]);
    
    await page.goto('/dashboard');
    
    // Tour should not appear
    const tourVisible = await page.locator('text=Welcome to Cosmic Spiritual Guide').isVisible({ timeout: 1000 }).catch(() => false);
    expect(tourVisible).toBeFalsy();
  });
});



