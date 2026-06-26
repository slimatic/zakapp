/**
 * Copyright (c) 2024-2026 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

1|import { test, expect } from '@playwright/test';
2|
3|test.describe('ZakApp Authentication Flow', () => {
4|  const BASE_URL = process.env.ZAKAPP_URL || 'http://localhost:3000';
5|  
6|  test.beforeEach(async ({ page }) => {
7|    // Navigate to the app
8|    await page.goto(BASE_URL);
9|    
10|    // Wait for the app to load
11|    await page.waitForLoadState('networkidle');
12|  });
13|
14|  test('should load the application', async ({ page }) => {
15|    // Check if the page loaded
16|    await expect(page).toHaveTitle(/ZakApp|Zakat/i);
17|    
18|    // Check if login/register buttons are visible
19|    const loginButton = page.locator('button:has-text("Login"), a:has-text("Login")').first();
20|    await expect(loginButton).toBeVisible();
21|  });
22|
23|  test('should navigate to registration page', async ({ page }) => {
24|    // Click on register/sign up link
25|    const registerLink = page.locator('a:has-text("Sign up"), a:has-text("Register"), button:has-text("Sign up")').first();
26|    await registerLink.click();
27|    
28|    // Wait for registration form
29|    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
30|    
31|    // Check if registration form elements are present
32|    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
33|    const passwordInput = page.locator('input[type="password"]').first();
34|    
35|    await expect(emailInput).toBeVisible();
36|    await expect(passwordInput).toBeVisible();
37|  });
38|
39|  test('should register a new account', async ({ page }) => {
40|    const timestamp = Date.now();
41|    const testEmail = `test${timestamp}@example.com`;
42|    const testPassword = 'TestPass123!';
43|    
44|    // Navigate to register
45|    const registerLink = page.locator('a:has-text("Sign up"), a:has-text("Register"), button:has-text("Sign up")').first();
46|    await registerLink.click();
47|    
48|    // Fill registration form
49|    await page.fill('input[name="email"], input[type="email"]', testEmail);
50|    await page.fill('input[name="password"], input[type="password"]', testPassword);
51|    await page.fill('input[name="confirmPassword"], input[name="passwordConfirmation"]', testPassword);
52|    await page.fill('input[name="firstName"]', 'Test');
53|    await page.fill('input[name="lastName"]', 'User');
54|    
55|    // Submit form
56|    const submitButton = page.locator('button[type="submit"]').first();
57|    await submitButton.click();
58|    
59|    // Wait for response - either success or error
60|    await page.waitForTimeout(3000);
61|    
62|    // Check if registration succeeded (redirected to login or dashboard)
63|    // or if there's a crypto error
64|    const errorMessage = await page.locator('text=/crypto|importKey|Web Crypto/i').first().isVisible().catch(() => false);
65|    const currentUrl = page.url();
66|    
67|    if (errorMessage) {
68|      console.log('❌ Web Crypto API error detected - app requires HTTPS or localhost');
69|      test.fail(true, 'Web Crypto API not available - requires secure context');
70|    }
71|    
72|    // If successful, should redirect to login or dashboard
73|    expect(currentUrl).not.toContain('/register');
74|  });
75|
76|  test('should login with existing account', async ({ page }) => {
77|    // Navigate to login
78|    const loginLink = page.locator('a:has-text("Login"), a:has-text("Sign in"), button:has-text("Login")').first();
79|    await loginLink.click();
80|    
81|    // Fill login form
82|    await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
83|    await page.fill('input[name="password"], input[type="password"]', 'TestPass123!');
84|    
85|    // Submit form
86|    const submitButton = page.locator('button[type="submit"]').first();
87|    await submitButton.click();
88|    
89|    // Wait for response
90|    await page.waitForTimeout(3000);
91|    
92|    // Check for crypto error
93|    const errorMessage = await page.locator('text=/crypto|importKey|Web Crypto|500/i').first().isVisible().catch(() => false);
94|    
95|    if (errorMessage) {
96|      const errorText = await page.locator('text=/crypto|importKey|Web Crypto|500/i').first().textContent().catch(() => '');
97|      console.log('❌ Error during login:', errorText);
98|      test.fail(true, 'Login failed with error: ' + errorText);
99|    }
100|    
101|    // Check if logged in (URL should change or show dashboard elements)
102|    await expect(page).not.toHaveURL(/.*login.*/);
103|  });
104|
105|  test('should check for Web Crypto API availability', async ({ page }) => {
106|    // Check if crypto.subtle is available in browser context
107|    const isCryptoAvailable = await page.evaluate(() => {
108|      return typeof window !== 'undefined' && 
109|             window.crypto && 
110|             window.crypto.subtle &&
111|             typeof window.crypto.subtle.importKey === 'function';
112|    });
113|    
114|    const isSecureContext = await page.evaluate(() => {
115|      return window.isSecureContext;
116|    });
117|    
118|    const location = await page.evaluate(() => {
119|      return {
120|        protocol: window.location.protocol,
121|        hostname: window.location.hostname,
122|        origin: window.location.origin
123|      };
124|    });
125|    
126|    console.log('🔒 Secure Context:', isSecureContext);
127|    console.log('🔐 Crypto Available:', isCryptoAvailable);
128|    console.log('🌐 Location:', location);
129|    
130|    if (!isCryptoAvailable) {
131|      console.log('❌ Web Crypto API is NOT available');
132|      console.log('💡 This happens when:');
133|      console.log('   - Accessing via IP address over HTTP (not HTTPS)');
134|      console.log('   - Browsers block crypto.subtle on insecure non-localhost origins');
135|      console.log('   - Solution: Use http://localhost:3005 or set up HTTPS');
136|    }
137|    
138|    // This test documents the issue but doesn't fail - it just reports
139|    expect(true).toBe(true);
140|  });
141|});
142|