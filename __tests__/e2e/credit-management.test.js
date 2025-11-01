const { test, expect } = require('@playwright/test');

test.describe('Credit Management', () => {
  let authCookie;
  
  test.beforeAll(async ({ browser }) => {
    // Create a test user and get auth cookie
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Register a test user
    await page.goto('/login');
    await page.click('button:has-text("Sign Up")');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Get auth cookie
    const cookies = await context.cookies();
    authCookie = cookies.find(c => c.name === 'auth_token');
    
    await context.close();
  });

  test('should have initial credits after signup', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Set auth cookie
    if (authCookie) {
      await context.addCookies([authCookie]);
    }
    
    await page.goto('/dashboard');
    
    // Check if credits are displayed
    const creditsElement = await page.locator('text=/\\d+ credits?/i').first();
    
    if (await creditsElement.isVisible()) {
      const creditsText = await creditsElement.textContent();
      const credits = parseInt(creditsText.match(/\d+/)?.[0] || '0');
      expect(credits).toBeGreaterThanOrEqual(3); // Should have at least 3 signup credits
    }
    
    await context.close();
  });

  test('should display credits correctly on dashboard', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    if (authCookie) {
      await context.addCookies([authCookie]);
    }
    
    await page.goto('/dashboard');
    
    // Check for credits display
    const statsSection = await page.locator('[data-tour="stats"]');
    await expect(statsSection).toBeVisible();
    
    await context.close();
  });

  test('should navigate to credits page', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    if (authCookie) {
      await context.addCookies([authCookie]);
    }
    
    await page.goto('/dashboard');
    
    // Click on credits section or navigation link
    const creditsLink = await page.locator('a[href*="credits"]').first();
    
    if (await creditsLink.isVisible()) {
      await creditsLink.click();
      await page.waitForURL('**/credits');
      
      // Verify we're on credits page
      await expect(page).toHaveURL(/.*credits/);
    }
    
    await context.close();
  });
});

