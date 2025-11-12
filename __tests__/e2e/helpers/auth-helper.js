/**
 * Test Helper: Authentication
 * Ensures test user exists and provides login helper
 */

export async function ensureTestUser(page) {
  const testEmail = 'test@example.com';
  const testPassword = 'password123';
  
  // First, try to navigate to dashboard - maybe we're already logged in
  try {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 5000 });
    await page.waitForTimeout(1000); // Wait for potential redirect
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard') && !currentUrl.includes('/login')) {
      // Already logged in!
      await page.waitForLoadState('networkidle');
      return true;
    }
  } catch {
    // Not logged in, continue with auth flow
  }
  
  // Try login first via UI
  try {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.waitForTimeout(500);
    
    // Fill login form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    
    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);
    await page.waitForTimeout(200);
    
    // Set up response listener BEFORE clicking
    const loginResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/auth/login') && r.status() !== 0,
      { timeout: 10000 }
    );
    
    // Click submit
    await page.locator('button[type="submit"]').first().click();
    
    // Wait for response
    const loginResponse = await loginResponsePromise;
    
    // Check if login was successful
    if (loginResponse && loginResponse.ok()) {
      // Wait a moment for client-side navigation
      await page.waitForTimeout(1000);
      
      // Check if we're on dashboard
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        await page.waitForLoadState('networkidle');
        return true;
      }
      
      // Try waiting for navigation
      try {
        await page.waitForURL('/dashboard', { timeout: 5000 });
        await page.waitForLoadState('networkidle');
        return true;
      } catch {
        // Navigation didn't happen, navigate manually
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForLoadState('networkidle');
        return true;
      }
    }
  } catch (error) {
    console.log('Login attempt failed:', error.message);
  }
  
  // If login failed, try signup
  try {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.waitForTimeout(500);
    
    // Switch to signup tab
    const signupTab = page.locator('button:has-text("Signup"), button:has-text("Sign Up")').first();
    const isSignupTabVisible = await signupTab.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (isSignupTabVisible) {
      await signupTab.click();
      await page.waitForTimeout(500);
    }
    
    // Fill signup form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const firstNameInput = page.locator('input[name="firstName"]').first();
    const lastNameInput = page.locator('input[name="lastName"]').first();
    
    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);
    
    if (await firstNameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await firstNameInput.fill('Test');
    }
    if (await lastNameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await lastNameInput.fill('User');
    }
    
    await page.waitForTimeout(200);
    
    // Set up response listener BEFORE clicking
    const signupResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/auth/signup') && r.status() !== 0,
      { timeout: 10000 }
    );
    
    // Click submit
    await page.locator('button[type="submit"]').first().click();
    
    // Wait for response
    const signupResponse = await signupResponsePromise;
    
    // Check if signup was successful
    if (signupResponse && signupResponse.ok()) {
      // Wait a moment for client-side navigation
      await page.waitForTimeout(1000);
      
      // Check if we're on dashboard
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        await page.waitForLoadState('networkidle');
        return true;
      }
      
      // Try waiting for navigation
      try {
        await page.waitForURL('/dashboard', { timeout: 5000 });
        await page.waitForLoadState('networkidle');
        return true;
      } catch {
        // Navigation didn't happen, navigate manually
        await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForLoadState('networkidle');
        return true;
      }
    } else if (signupResponse && !signupResponse.ok()) {
      // Signup failed - might be "email already in use", try login again
      try {
        const signupData = await signupResponse.json().catch(() => ({}));
        if (signupData.error && signupData.error.includes('already in use')) {
          // User exists, try login again
          await page.goto('/login', { waitUntil: 'domcontentloaded' });
          await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
          await page.waitForTimeout(500);
          
          const retryEmailInput = page.locator('input[type="email"], input[name="email"]').first();
          const retryPasswordInput = page.locator('input[type="password"], input[name="password"]').first();
          
          await retryEmailInput.fill(testEmail);
          await retryPasswordInput.fill(testPassword);
          await page.waitForTimeout(200);
          
          // Set up response listener
          const retryResponsePromise = page.waitForResponse(
            (r) => r.url().includes('/api/auth/login') && r.status() !== 0,
            { timeout: 10000 }
          );
          
          await page.locator('button[type="submit"]').first().click();
          const retryResponse = await retryResponsePromise;
          
          if (retryResponse && retryResponse.ok()) {
            await page.waitForTimeout(1000);
            const url = page.url();
            if (url.includes('/dashboard')) {
              await page.waitForLoadState('networkidle');
              return true;
            }
            try {
              await page.waitForURL('/dashboard', { timeout: 5000 });
              await page.waitForLoadState('networkidle');
              return true;
            } catch {
              await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 10000 });
              await page.waitForLoadState('networkidle');
              return true;
            }
          }
        }
      } catch {
        // Ignore error parsing signup response
      }
    }
  } catch (error) {
    console.log('Signup attempt failed:', error.message);
  }
  
  // Last resort: try to navigate to dashboard anyway
  try {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(1000);
    const url = page.url();
    if (url.includes('/dashboard') && !url.includes('/login')) {
      await page.waitForLoadState('networkidle');
      return true;
    }
  } catch {
    // Final fallback failed
  }
  
  throw new Error('Failed to create or login test user after all attempts');
}
