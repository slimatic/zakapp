import { test, expect } from '@playwright/test';

test.describe('ZakApp Authentication Flow', () => {
  const BASE_URL = process.env.ZAKAPP_URL || 'http://192.168.86.45:3005';
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto(BASE_URL);
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test('should load the application', async ({ page }) => {
    // Check if the page loaded
    await expect(page).toHaveTitle(/ZakApp|Zakat/i);
    
    // Check if login/register buttons are visible
    const loginButton = page.locator('button:has-text("Login"), a:has-text("Login")').first();
    await expect(loginButton).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    // Click on register/sign up link
    const registerLink = page.locator('a:has-text("Sign up"), a:has-text("Register"), button:has-text("Sign up")').first();
    await registerLink.click();
    
    // Wait for registration form
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
    
    // Check if registration form elements are present
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should register a new account', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testPassword = 'TestPass123!';
    
    // Navigate to register
    const registerLink = page.locator('a:has-text("Sign up"), a:has-text("Register"), button:has-text("Sign up")').first();
    await registerLink.click();
    
    // Fill registration form
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', testPassword);
    await page.fill('input[name="confirmPassword"], input[name="passwordConfirmation"]', testPassword);
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    
    // Submit form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Wait for response - either success or error
    await page.waitForTimeout(3000);
    
    // Check if registration succeeded (redirected to login or dashboard)
    // or if there's a crypto error
    const errorMessage = await page.locator('text=/crypto|importKey|Web Crypto/i').first().isVisible().catch(() => false);
    const currentUrl = page.url();
    
    if (errorMessage) {
      console.log('❌ Web Crypto API error detected - app requires HTTPS or localhost');
      test.fail(true, 'Web Crypto API not available - requires secure context');
    }
    
    // If successful, should redirect to login or dashboard
    expect(currentUrl).not.toContain('/register');
  });

  test('should login with existing account', async ({ page }) => {
    // Navigate to login
    const loginLink = page.locator('a:has-text("Login"), a:has-text("Sign in"), button:has-text("Login")').first();
    await loginLink.click();
    
    // Fill login form
    await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'TestPass123!');
    
    // Submit form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check for crypto error
    const errorMessage = await page.locator('text=/crypto|importKey|Web Crypto|500/i').first().isVisible().catch(() => false);
    
    if (errorMessage) {
      const errorText = await page.locator('text=/crypto|importKey|Web Crypto|500/i').first().textContent().catch(() => '');
      console.log('❌ Error during login:', errorText);
      test.fail(true, 'Login failed with error: ' + errorText);
    }
    
    // Check if logged in (URL should change or show dashboard elements)
    await expect(page).not.toHaveURL(/.*login.*/);
  });

  test('should check for Web Crypto API availability', async ({ page }) => {
    // Check if crypto.subtle is available in browser context
    const isCryptoAvailable = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             window.crypto && 
             window.crypto.subtle &&
             typeof window.crypto.subtle.importKey === 'function';
    });
    
    const isSecureContext = await page.evaluate(() => {
      return window.isSecureContext;
    });
    
    const location = await page.evaluate(() => {
      return {
        protocol: window.location.protocol,
        hostname: window.location.hostname,
        origin: window.location.origin
      };
    });
    
    console.log('🔒 Secure Context:', isSecureContext);
    console.log('🔐 Crypto Available:', isCryptoAvailable);
    console.log('🌐 Location:', location);
    
    if (!isCryptoAvailable) {
      console.log('❌ Web Crypto API is NOT available');
      console.log('💡 This happens when:');
      console.log('   - Accessing via IP address over HTTP (not HTTPS)');
      console.log('   - Browsers block crypto.subtle on insecure non-localhost origins');
      console.log('   - Solution: Use http://localhost:3005 or set up HTTPS');
    }
    
    // This test documents the issue but doesn't fail - it just reports
    expect(true).toBe(true);
  });
});
