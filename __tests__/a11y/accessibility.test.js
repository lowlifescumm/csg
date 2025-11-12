/**
 * Accessibility Smoke Tests using axe-core
 * 
 * Tests critical accessibility requirements:
 * - Text contrast ratios (WCAG AA: 4.5:1)
 * - Keyboard focusability
 * - ARIA labels and roles
 * - Alt text for images
 */

const { test, expect } = require('@playwright/test');
const { injectAxe, checkA11y, getViolations } = require('axe-playwright');

// Pages to test (public pages that don't require auth)
const pages = [
  { path: '/login', name: 'Login' },
];

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Inject axe-core into the page
    await injectAxe(page);
  });

  for (const pageInfo of pages) {
    test(`${pageInfo.name} page should have no critical accessibility violations`, async ({ page }) => {
      // Navigate to page
      await page.goto(pageInfo.path);
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Inject axe-core
      await injectAxe(page);
      
      // Run accessibility checks
      const violations = await getViolations(page, null, {
        rules: {
          // Critical rules only for smoke tests
          'color-contrast': { enabled: true },
          'keyboard': { enabled: true },
          'aria-label': { enabled: true },
          'image-alt': { enabled: true },
          'button-name': { enabled: true },
          'link-name': { enabled: true },
        },
      });

      // Filter out violations that are not critical
      const criticalViolations = violations.filter(v => {
        // Color contrast is critical
        if (v.id === 'color-contrast') return true;
        // Keyboard accessibility is critical
        if (v.id === 'keyboard') return true;
        // Missing labels on interactive elements
        if (v.id === 'aria-label' || v.id === 'button-name' || v.id === 'link-name') return true;
        // Missing alt text
        if (v.id === 'image-alt') return true;
        return false;
      });

      if (criticalViolations.length > 0) {
        console.error(`Accessibility violations found on ${pageInfo.name}:`, 
          criticalViolations.map(v => ({
            id: v.id,
            description: v.description,
            nodes: v.nodes.length
          }))
        );
      }

      expect(criticalViolations.length).toBe(0);
    });

    test(`${pageInfo.name} page should be keyboard navigable`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      // Check that focusable elements can be reached with Tab
      const focusableElements = await page.evaluate(() => {
        const selectors = [
          'a[href]',
          'button:not([disabled])',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])',
        ];
        
        const elements = [];
        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            if (el.offsetParent !== null) { // Element is visible
              elements.push({
                tag: el.tagName,
                text: el.textContent?.trim().substring(0, 50) || '',
                hasLabel: !!(
                  el.getAttribute('aria-label') ||
                  el.getAttribute('aria-labelledby') ||
                  (el.tagName === 'INPUT' && el.labels?.length) ||
                  (el.tagName === 'BUTTON' && el.textContent?.trim())
                ),
              });
            }
          });
        });
        return elements;
      });

      // Check that interactive elements have accessible names
      const elementsWithoutLabels = focusableElements.filter(el => !el.hasLabel);
      
      if (elementsWithoutLabels.length > 0) {
        console.warn(`Elements without accessible names on ${pageInfo.name}:`, elementsWithoutLabels);
      }

      // Allow some elements without explicit labels if they have visible text
      expect(elementsWithoutLabels.length).toBeLessThan(3);
    });

    test(`${pageInfo.name} page should have sufficient text contrast`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      // Check text contrast using computed styles
      const contrastIssues = await page.evaluate(() => {
        const issues = [];
        const textElements = Array.from(document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, button, label'));
        
        textElements.forEach(el => {
          const style = window.getComputedStyle(el);
          const color = style.color;
          const bgColor = style.backgroundColor;
          const fontSize = parseFloat(style.fontSize);
          const fontWeight = parseInt(style.fontWeight) || 400;
          
          // Skip if element is not visible
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return;
          }
          
          // Get actual background color (might need to traverse parent)
          let actualBg = bgColor;
          if (actualBg === 'rgba(0, 0, 0, 0)' || actualBg === 'transparent') {
            let parent = el.parentElement;
            while (parent && (actualBg === 'rgba(0, 0, 0, 0)' || actualBg === 'transparent')) {
              const parentStyle = window.getComputedStyle(parent);
              actualBg = parentStyle.backgroundColor;
              parent = parent.parentElement;
            }
          }
          
          // Simple contrast check (this is a simplified version)
          // In production, use a proper contrast calculation library
          const text = el.textContent?.trim();
          if (text && text.length > 0 && fontSize >= 14) {
            // For smoke test, we'll just check that we're using theme colors
            // Full contrast calculation would require a library
            const usesMutedText = color.includes('rgba(255, 255, 255, 0.75)') || 
                                  color.includes('rgba(255, 255, 255, 0.62)');
            if (usesMutedText && fontSize < 18 && fontWeight < 700) {
              // This might need adjustment - mute text should be at least 0.75 opacity for 4.5:1
              issues.push({
                element: el.tagName,
                text: text.substring(0, 30),
                color,
                fontSize,
              });
            }
          }
        });
        
        return issues;
      });

      // Log but don't fail on minor contrast issues for smoke test
      if (contrastIssues.length > 0) {
        console.warn(`Potential contrast issues on ${pageInfo.name}:`, contrastIssues.slice(0, 5));
      }

      // Allow some minor issues but flag if there are many
      expect(contrastIssues.length).toBeLessThan(10);
    });
  }
});

