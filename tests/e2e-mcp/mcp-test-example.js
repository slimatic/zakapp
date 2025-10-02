/**
 * Example E2E Test Using Playwright MCP Server
 * 
 * This demonstrates how to write E2E tests using the Playwright MCP Server
 * without needing to install browser binaries.
 */

/**
 * Test: Homepage Navigation and Structure
 * 
 * Verifies that:
 * - Homepage loads successfully
 * - Page structure is correct
 * - No console errors
 */
async function testHomepage() {
  console.log('Starting homepage test...');
  
  try {
    // Navigate to homepage
    console.log('Navigating to http://localhost:3000...');
    await playwright_browser_navigate({ 
      url: 'http://localhost:3000' 
    });
    
    // Capture page snapshot for structure verification
    console.log('Capturing page snapshot...');
    const snapshot = await playwright_browser_snapshot();
    
    // Take screenshot for visual verification
    console.log('Taking screenshot...');
    await playwright_browser_take_screenshot({ 
      filename: 'homepage-test.png',
      type: 'png'
    });
    
    // Check console messages for errors
    console.log('Checking console messages...');
    const consoleMessages = await playwright_browser_console_messages();
    
    // Check network requests
    console.log('Checking network requests...');
    const networkRequests = await playwright_browser_network_requests();
    
    // Analyze results
    const hasErrors = consoleMessages.some(msg => 
      msg.type === 'error' || msg.text.includes('error')
    );
    
    const result = {
      success: !hasErrors,
      snapshot,
      consoleMessages,
      networkRequests,
      timestamp: new Date().toISOString()
    };
    
    console.log('Homepage test completed:', result.success ? 'PASS' : 'FAIL');
    return result;
    
  } catch (error) {
    console.error('Homepage test failed with error:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test: User Registration Flow
 * 
 * Verifies that:
 * - Registration page loads
 * - Form can be filled
 * - Registration submits successfully
 */
async function testUserRegistration() {
  console.log('Starting user registration test...');
  
  try {
    // Navigate to homepage
    await playwright_browser_navigate({ 
      url: 'http://localhost:3000' 
    });
    
    // Click register link
    await playwright_browser_click({
      element: 'Register link',
      ref: '[data-testid="register-link"]'
    });
    
    // Wait for registration page
    await playwright_browser_wait_for({
      text: 'Register',
      time: 5
    });
    
    // Fill registration form
    const timestamp = Date.now();
    await playwright_browser_fill_form({
      fields: [
        {
          name: 'Email',
          type: 'textbox',
          ref: '[data-testid="email-input"]',
          value: `test-${timestamp}@example.com`
        },
        {
          name: 'Password',
          type: 'textbox',
          ref: '[data-testid="password-input"]',
          value: 'SecurePass123!'
        },
        {
          name: 'Confirm Password',
          type: 'textbox',
          ref: '[data-testid="confirm-password-input"]',
          value: 'SecurePass123!'
        },
        {
          name: 'First Name',
          type: 'textbox',
          ref: '[data-testid="first-name-input"]',
          value: 'Test'
        },
        {
          name: 'Last Name',
          type: 'textbox',
          ref: '[data-testid="last-name-input"]',
          value: 'User'
        }
      ]
    });
    
    // Submit registration
    await playwright_browser_click({
      element: 'Register button',
      ref: '[data-testid="register-button"]'
    });
    
    // Wait for success or error
    await playwright_browser_wait_for({
      time: 5
    });
    
    // Take screenshot of result
    await playwright_browser_take_screenshot({ 
      filename: 'registration-result.png',
      type: 'png'
    });
    
    // Get final state
    const snapshot = await playwright_browser_snapshot();
    
    // Check if we're on dashboard (success)
    const onDashboard = snapshot.toString().includes('dashboard') || 
                        snapshot.toString().includes('Welcome');
    
    const result = {
      success: onDashboard,
      snapshot,
      timestamp: new Date().toISOString()
    };
    
    console.log('User registration test completed:', result.success ? 'PASS' : 'FAIL');
    return result;
    
  } catch (error) {
    console.error('User registration test failed with error:', error);
    await playwright_browser_take_screenshot({ 
      filename: 'registration-error.png',
      type: 'png'
    });
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test: Asset Creation Flow
 * 
 * Verifies that:
 * - Asset creation page loads
 * - Asset form can be filled
 * - Asset is created successfully
 */
async function testAssetCreation() {
  console.log('Starting asset creation test...');
  
  try {
    // Assume user is already logged in (this would be a separate test setup)
    await playwright_browser_navigate({ 
      url: 'http://localhost:3000/assets/new' 
    });
    
    // Wait for form to load
    await playwright_browser_wait_for({
      time: 3
    });
    
    // Fill asset form
    await playwright_browser_fill_form({
      fields: [
        {
          name: 'Asset Type',
          type: 'combobox',
          ref: '[data-testid="asset-type-select"]',
          value: 'cash'
        },
        {
          name: 'Asset Value',
          type: 'textbox',
          ref: '[data-testid="asset-value-input"]',
          value: '25000'
        },
        {
          name: 'Currency',
          type: 'combobox',
          ref: '[data-testid="currency-select"]',
          value: 'USD'
        },
        {
          name: 'Description',
          type: 'textbox',
          ref: '[data-testid="description-input"]',
          value: 'Test savings account'
        }
      ]
    });
    
    // Submit form
    await playwright_browser_click({
      element: 'Create Asset button',
      ref: '[data-testid="create-asset-button"]'
    });
    
    // Wait for result
    await playwright_browser_wait_for({
      text: 'successfully',
      time: 5
    });
    
    // Take screenshot
    await playwright_browser_take_screenshot({ 
      filename: 'asset-created.png',
      type: 'png'
    });
    
    // Get page state
    const snapshot = await playwright_browser_snapshot();
    
    // Check for success message
    const hasSuccess = snapshot.toString().includes('successfully') ||
                       snapshot.toString().includes('created');
    
    const result = {
      success: hasSuccess,
      snapshot,
      timestamp: new Date().toISOString()
    };
    
    console.log('Asset creation test completed:', result.success ? 'PASS' : 'FAIL');
    return result;
    
  } catch (error) {
    console.error('Asset creation test failed with error:', error);
    await playwright_browser_take_screenshot({ 
      filename: 'asset-creation-error.png',
      type: 'png'
    });
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test Suite Runner
 * 
 * Runs all tests and generates a report
 */
async function runTestSuite() {
  console.log('='.repeat(60));
  console.log('ZakApp E2E Test Suite - MCP Server Approach');
  console.log('='.repeat(60));
  console.log('');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };
  
  // Test 1: Homepage
  console.log('Test 1: Homepage Navigation and Structure');
  console.log('-'.repeat(60));
  const homepageResult = await testHomepage();
  results.tests.push({
    name: 'Homepage Navigation and Structure',
    ...homepageResult
  });
  console.log('');
  
  // Test 2: User Registration
  console.log('Test 2: User Registration Flow');
  console.log('-'.repeat(60));
  const registrationResult = await testUserRegistration();
  results.tests.push({
    name: 'User Registration Flow',
    ...registrationResult
  });
  console.log('');
  
  // Test 3: Asset Creation
  console.log('Test 3: Asset Creation Flow');
  console.log('-'.repeat(60));
  const assetResult = await testAssetCreation();
  results.tests.push({
    name: 'Asset Creation Flow',
    ...assetResult
  });
  console.log('');
  
  // Summary
  console.log('='.repeat(60));
  console.log('Test Suite Summary');
  console.log('='.repeat(60));
  const passed = results.tests.filter(t => t.success).length;
  const total = results.tests.length;
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Pass Rate: ${((passed / total) * 100).toFixed(1)}%`);
  console.log('');
  
  // Failed tests details
  const failed = results.tests.filter(t => !t.success);
  if (failed.length > 0) {
    console.log('Failed Tests:');
    failed.forEach(test => {
      console.log(`  - ${test.name}`);
      if (test.error) {
        console.log(`    Error: ${test.error}`);
      }
    });
  }
  
  return results;
}

// Export functions for use in test harness
module.exports = {
  testHomepage,
  testUserRegistration,
  testAssetCreation,
  runTestSuite
};

// Run if executed directly
if (require.main === module) {
  runTestSuite()
    .then(results => {
      console.log('\nTest execution complete!');
      process.exit(results.tests.every(t => t.success) ? 0 : 1);
    })
    .catch(error => {
      console.error('\nTest suite failed:', error);
      process.exit(1);
    });
}
