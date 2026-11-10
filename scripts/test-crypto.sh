#!/bin/bash
# Quick Crypto API Test using Docker
# Tests if ZakApp's crypto functionality works from a browser context

echo "🔐 ZakApp Crypto API Diagnostic Test"
echo "====================================="
echo ""

# Default URL
ZAKAPP_URL="${1:-http://host.docker.internal:3005}"
echo "Testing against: $ZAKAPP_URL"
echo ""

# Create results directory
mkdir -p test-results

# Run a simple Node.js script that uses Playwright
docker run --rm \
  --network host \
  -v "$(pwd)/test-results:/results" \
  -e ZAKAPP_URL="$ZAKAPP_URL" \
  mcr.microsoft.com/playwright:v1.49.1-jammy \
  node -e "
const { chromium } = require('playwright');

(async () => {
  console.log('🌐 Launching headless browser...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });
  
  console.log('📄 Navigating to:', process.env.ZAKAPP_URL);
  await page.goto(process.env.ZAKAPP_URL);
  await page.waitForLoadState('networkidle');
  
  console.log('🔍 Checking Web Crypto API...\n');
  
  const cryptoInfo = await page.evaluate(() => {
    return {
      hasCrypto: typeof window !== 'undefined' && !!window.crypto,
      hasSubtle: typeof window !== 'undefined' && !!(window.crypto && window.crypto.subtle),
      hasImportKey: typeof window !== 'undefined' && !!(window.crypto && window.crypto.subtle && window.crypto.subtle.importKey),
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      origin: window.location.origin
    };
  });
  
  console.log('Browser Context:');
  console.log('  URL:', process.env.ZAKAPP_URL);
  console.log('  Protocol:', cryptoInfo.protocol);
  console.log('  Hostname:', cryptoInfo.hostname);
  console.log('  Secure Context:', cryptoInfo.isSecureContext ? '✅ Yes' : '❌ No');
  console.log('  Has crypto:', cryptoInfo.hasCrypto ? '✅ Yes' : '❌ No');
  console.log('  Has subtle:', cryptoInfo.hasSubtle ? '✅ Yes' : '❌ No');
  console.log('  Has importKey:', cryptoInfo.hasImportKey ? '✅ Yes' : '❌ No');
  
  console.log('\n📸 Taking screenshot...');
  await page.screenshot({ path: '/results/crypto-test.png', fullPage: true });
  
  if (!cryptoInfo.hasImportKey) {
    console.log('\n❌ CRYPTO API NOT AVAILABLE');
    console.log('   Registration and login will FAIL!');
    console.log('\n💡 Solution:');
    console.log('   Access via http://localhost:3005 instead of the IP address');
    console.log('   Or set up HTTPS with a valid certificate');
  } else {
    console.log('\n✅ CRYPTO API IS AVAILABLE');
    console.log('   Registration and login should work!');
  }
  
  await browser.close();
  console.log('\n✅ Test complete! Screenshot saved to test-results/crypto-test.png');
})();
" 2>&1

echo ""
echo "Test completed. Check test-results/crypto-test.png"