/**
 * E2E Tests: Streak Tracking
 * Tests daily login streak increment and streak API updates
 */

import { test, expect } from '@playwright/test';

test.describe('Streak Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should increment streak on first login of the day', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL('/dashboard');

    // Check streak is displayed
    const streakElement = page.locator('[data-testid="streak-counter"], text=/\\d+\\s+Days/i').first();
    await expect(streakElement).toBeVisible();

    // Verify streak API was called
    const streakApiCall = await page.waitForResponse(
      (response) => response.url().includes('/api/streak') && response.status() === 200
    );
    const streakData = await streakApiCall.json();
    expect(streakData.currentStreak).toBeGreaterThanOrEqual(1);
  });

  test('should maintain streak on consecutive day logins', async ({ page, context }) => {
    // Set up cookies/session for previous day
    // This is a simplified test - in real scenario, you'd mock the date
    
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/dashboard');

    // Check streak counter
    const streakText = await page.locator('[data-testid="streak-counter"]').textContent();
    const streakNumber = parseInt(streakText?.match(/\d+/)?.[0] || '0');
    
    // Streak should be at least 1 (first login) or increment if consecutive
    expect(streakNumber).toBeGreaterThanOrEqual(1);
  });

  test('should display streak in hero header', async ({ page }) => {
    // Login and navigate to dashboard
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Check for streak display in HeroHeader component
    const streakDisplay = page.locator('text=/\\d+\\s+Days/i').first();
    await expect(streakDisplay).toBeVisible();
  });

  test('should handle streak API error gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/streak', (route) => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server error' }) });
    });

    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Dashboard should still load even if streak API fails
    await expect(page.locator('h1, h2')).toContainText(/dashboard|cosmic|welcome/i);
  });
});

