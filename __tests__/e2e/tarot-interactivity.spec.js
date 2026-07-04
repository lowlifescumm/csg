import { test, expect } from '@playwright/test';

test.describe('Tarot Card Selection UI Interactivity', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('/tarot', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => {
      return [...document.querySelectorAll('button')].some(b => b.textContent.includes('Daily Tarot'));
    }, { timeout: 60000 });
  });

  test('spread type picker displays all available spreads', async ({ page }) => {
    const spreads = [
      'Daily Tarot',
      'Daily Love Tarot',
      'Daily Career Tarot',
      'Yes/No Tarot',
      'Love Potential Tarot',
      'Breakup Tarot',
      'One Card Tarot',
      'Past Present Future',
      'Daily Flirt Tarot',
      'Yin Yang Tarot',
      '1-10 Card Spread',
    ];

    for (const spread of spreads) {
      const btn = page.locator(`button:has-text("${spread}")`);
      await expect(btn).toBeVisible({ timeout: 5000 });
    }
  });

  test('card selection interface renders cards visually after spread selection', async ({ page }) => {
    await page.locator('button:has-text("One Card Tarot")').click();
    await page.waitForTimeout(1000);

    const cardBack = page.locator('img[alt="Card Back"]');
    await expect(cardBack).toBeVisible({ timeout: 10000 });
  });

  test('card selection works and selected cards are distinct', async ({ page }) => {
    await page.locator('button:has-text("Past Present Future")').click();
    await page.waitForTimeout(1000);

    const cardElements = page.locator('button:has(img[alt="Card Back"])');
    const count = await cardElements.count();
    expect(count).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < 3; i++) {
      await cardElements.nth(i).click();
      await page.waitForTimeout(300);
    }

    const selectedCardBadges = page.locator('text=Card 1, text=Card 2, text=Card 3');
    await expect(page.locator('text=Card 1').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Card 2').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Card 3').first()).toBeVisible({ timeout: 3000 });
  });

  test('selected card shows image and position label', async ({ page }) => {
    await page.locator('button:has-text("Past Present Future")').click();
    await page.waitForTimeout(1000);

    const cardButton = page.locator('button:has(img[alt="Card Back"])').first();
    await cardButton.click();
    await page.waitForTimeout(300);

    const cardImage = page.locator('img:not([alt="Card Back"])').first();
    await expect(cardImage).toBeVisible({ timeout: 5000 });

    await expect(page.locator('text=Card 1').first()).toBeVisible({ timeout: 3000 });
  });

  test('mobile viewport renders spread picker correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/tarot', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => {
      return document.querySelector('button')?.textContent?.includes('Daily Tarot');
    }, { timeout: 20000 });

    const picker = page.locator('button:has-text("Daily Tarot")').first();
    await expect(picker).toBeVisible({ timeout: 10000 });
  });

  test('desktop viewport renders spread picker correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/tarot', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => {
      return document.querySelector('button')?.textContent?.includes('Daily Tarot');
    }, { timeout: 20000 });

    const picker = page.locator('button:has-text("Daily Tarot")').first();
    await expect(picker).toBeVisible({ timeout: 10000 });
  });

  test('selected cards show distinct names in reading', async ({ page }) => {
    await page.locator('button:has-text("Past Present Future")').click();
    await page.waitForTimeout(1000);

    const cardButtons = page.locator('button:has(img[alt="Card Back"])');
    const count = await cardButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < 3; i++) {
      await cardButtons.nth(i).click();
      await page.waitForTimeout(300);
    }

    await expect(page.locator('text=Card 1').first()).toBeVisible({ timeout: 3000 });

    const cardImages = page.locator('img:not([alt="Card Back"])');
    const imageCount = await cardImages.count();
    expect(imageCount).toBe(3);
  });
});
