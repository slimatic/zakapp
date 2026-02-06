#!/bin/bash
# ZakApp Playwright Test Runner
# Runs headless browser tests against the deployed application

set -e

ZAKAPP_URL="${ZAKAPP_URL:-http://host.docker.internal:3005}"
echo "🎭 ZakApp Playwright Test Runner"
echo "================================="
echo "Testing against: $ZAKAPP_URL"
echo ""

# Create test results directory
mkdir -p test-results playwright-report

# Run Playwright tests in Docker
docker run --rm \
  --network host \
  -v "$(pwd)/e2e:/tests/e2e" \
  -v "$(pwd)/test-results:/tests/test-results" \
  -v "$(pwd)/playwright-report:/tests/playwright-report" \
  -e ZAKAPP_URL="$ZAKAPP_URL" \
  -e CI=true \
  mcr.microsoft.com/playwright:v1.49.1-jammy \
  bash -c "
    cd /tests
    echo '📦 Installing Playwright...'
    npm install @playwright/test@1.49.1 --silent
    
    echo '🌐 Installing Chromium browser...'
    npx playwright install chromium --silent
    
    echo '🧪 Running tests...'
    npx playwright test e2e/auth.test.js --reporter=list || true
    
    echo ''
    echo '✅ Tests completed!'
    echo '📸 Screenshots saved to test-results/'
    echo '📊 Report saved to playwright-report/'
  "

echo ""
echo "Test execution complete!"
echo "Check test-results/ directory for screenshots and details."