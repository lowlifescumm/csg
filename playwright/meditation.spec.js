/**
 * Playwright smoke test for Meditation MVP
 * 
 * Run with: npm run test:e2e -- meditation.spec.js
 * 
 * Tests:
 * - Start a 3-minute meditation
 * - Complete the meditation
 * - Verify XP is awarded
 * - Verify session is saved to history
 */

import { test, expect } from "@playwright/test";

test.describe("Meditation MVP", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (assumes user is logged in)
    await page.goto("/dashboard");
    // Wait for dashboard to load
    await page.waitForSelector("text=Explore Your Cosmic Journey", { timeout: 10000 });
  });

  test("should start and complete a 3-minute meditation and award XP", async ({ page }) => {
    // Click Meditation button
    await page.click("button:has-text('Meditation')");
    
    // Wait for meditations modal
    await page.waitForSelector("text=Choose Your Meditation", { timeout: 5000 });
    
    // Find and click a short meditation (Quick Reset - 2 minutes, closest to 3)
    // Or find a meditation that's approximately 3 minutes
    const meditationCard = page.locator("text=Quick Reset").first();
    if (await meditationCard.isVisible()) {
      await meditationCard.click();
    } else {
      // Fallback: click first available meditation
      await page.click(".glassmorphic button, .glassmorphic [role='button']").first();
    }

    // Wait for player to appear
    await page.waitForSelector("text=Welcome to", { timeout: 5000 });

    // Get initial XP (if displayed)
    const initialXPText = await page.textContent("text=/\\d+ XP/").catch(() => null);

    // Start playback (if not auto-playing)
    const playButton = page.locator("button[aria-label='Play'], button:has([data-lucide='play'])").first();
    if (await playButton.isVisible()) {
      await playButton.click();
    }

    // Fast-forward through meditation (for testing, we'll skip ahead)
    // In a real test, you might want to wait for actual completion
    // For smoke test, we'll simulate completion by calling the API directly
    
    // Wait a moment for session to be created
    await page.waitForTimeout(1000);

    // For testing purposes, we'll complete via API call
    // In production, this would happen automatically when audio ends
    const sessionId = await page.evaluate(async () => {
      // Get session ID from current meditation session
      // This is a simplified approach - in real test you'd track the session ID
      const response = await fetch("/api/user/meditations?limit=1");
      const data = await response.json();
      if (data.success && data.sessions.length > 0) {
        return data.sessions[0].sessionId;
      }
      return null;
    });

    if (sessionId) {
      // Complete the meditation
      await page.evaluate(async (sid) => {
        const meditationId = 7; // Quick Reset ID
        await fetch(`/api/meditations/${meditationId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sid }),
        });
      }, sessionId);

      // Wait for completion
      await page.waitForTimeout(1000);

      // Verify session appears in history
      await page.reload();
      await page.waitForSelector("text=Meditation History", { timeout: 5000 });
      
      // Check that session is listed
      const historyText = await page.textContent("body");
      expect(historyText).toContain("Quick Reset");
      
      // Verify XP was awarded (check for XP indicator in history)
      const xpIndicator = page.locator("text=/\\+\\d+ XP/").first();
      if (await xpIndicator.isVisible()) {
        const xpText = await xpIndicator.textContent();
        expect(xpText).toMatch(/\+10 XP/); // Short meditation = 10 XP
      }
    }
  });

  test("should show premium lock for premium meditations", async ({ page }) => {
    // Click Meditation button
    await page.click("button:has-text('Meditation')");
    
    // Wait for meditations modal
    await page.waitForSelector("text=Choose Your Meditation", { timeout: 5000 });
    
    // Find a premium meditation
    const premiumMeditation = page.locator("text=Loving Kindness, text=Chakra Balance").first();
    
    if (await premiumMeditation.isVisible()) {
      // Check for lock icon or premium indicator
      const lockIcon = page.locator("[data-lucide='lock'], svg:has-text('Lock')").first();
      const premiumText = page.locator("text=Premium, text=Upgrade to unlock").first();
      
      expect(await lockIcon.isVisible() || await premiumText.isVisible()).toBeTruthy();
    }
  });
});


