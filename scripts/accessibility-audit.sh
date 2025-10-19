#!/bin/bash

# Accessibility Audit Script for ZakApp
# T032: Accessibility Audit Implementation

echo "♿ Starting ZakApp Accessibility Audit (T032)"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $message"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC}: $message"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC}: $message"
    elif [ "$status" = "INFO" ]; then
        echo -e "${BLUE}ℹ️  INFO${NC}: $message"
    else
        echo "   $message"
    fi
}

echo ""
echo "1. Checking Accessibility Dependencies"
echo "--------------------------------------"
cd /home/lunareclipse/zakapp/client

if npm list axe-core @axe-core/playwright > /dev/null 2>&1; then
    print_status "PASS" "axe-core and @axe-core/playwright are installed"
else
    print_status "FAIL" "axe-core dependencies not found - run: npm install --save-dev axe-core @axe-core/playwright"
    exit 1
fi

echo ""
echo "2. Running Automated Accessibility Tests"
echo "-----------------------------------------"
cd /home/lunareclipse/zakapp

# Check if backend is running
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    print_status "PASS" "Backend server is running"
else
    print_status "WARN" "Backend server not running - starting it..."
    # Start backend in background
    cd /home/lunareclipse/zakapp/server && npm run dev > /dev/null 2>&1 &
    BACKEND_PID=$!
    sleep 5

    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        print_status "PASS" "Backend server started successfully"
    else
        print_status "FAIL" "Failed to start backend server"
        exit 1
    fi
fi

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_status "PASS" "Frontend client is running"
else
    print_status "WARN" "Frontend client not running - starting it..."
    # Start frontend in background
    cd /home/lunareclipse/zakapp/client && npm start > /dev/null 2>&1 &
    FRONTEND_PID=$!
    sleep 10

    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_status "PASS" "Frontend client started successfully"
    else
        print_status "FAIL" "Failed to start frontend client"
        exit 1
    fi
fi

echo ""
echo "3. Running Playwright Accessibility Tests"
echo "------------------------------------------"

# Run accessibility tests
if npx playwright test tests/e2e/accessibility.spec.ts --headed=false; then
    print_status "PASS" "All accessibility tests passed"
    TEST_RESULT="PASS"
else
    print_status "FAIL" "Some accessibility tests failed"
    TEST_RESULT="FAIL"
fi

echo ""
echo "4. Generating Accessibility Report"
echo "-----------------------------------"

# Create accessibility report directory
mkdir -p /home/lunareclipse/zakapp/reports/accessibility

# Generate HTML report
npx playwright show-report > /home/lunareclipse/zakapp/reports/accessibility/report.html 2>/dev/null || true

# Create summary report
cat > /home/lunareclipse/zakapp/reports/accessibility/summary.md << EOF
# ZakApp Accessibility Audit Report

**Date**: $(date)
**Test Result**: $TEST_RESULT

## Test Coverage

- ✅ WCAG 2.1 AA compliance audit
- ✅ Keyboard navigation testing
- ✅ Screen reader compatibility
- ✅ Color contrast ratio validation
- ✅ ARIA labels and roles validation
- ✅ Form accessibility testing
- ✅ Mobile accessibility testing
- ✅ Focus management validation

## Recommendations

1. **Review Test Failures**: Check Playwright report for specific violations
2. **Fix Critical Issues**: Address any WCAG 2.1 AA violations immediately
3. **Manual Testing**: Perform manual accessibility testing with screen readers
4. **Color Contrast**: Ensure all text meets minimum contrast ratios
5. **Keyboard Navigation**: Verify all interactive elements are keyboard accessible
6. **Regular Audits**: Include accessibility testing in CI/CD pipeline

## Tools Used

- axe-core: Automated accessibility testing
- @axe-core/playwright: Playwright integration
- Playwright: Cross-browser testing framework

EOF

print_status "INFO" "Accessibility report generated: reports/accessibility/summary.md"

echo ""
echo "5. Manual Accessibility Checklist"
echo "----------------------------------"

print_status "INFO" "Perform these manual checks:"
echo "   • Test with keyboard-only navigation (Tab, Enter, Space, Arrow keys)"
echo "   • Test with screen reader (NVDA, JAWS, VoiceOver)"
echo "   • Verify focus indicators are visible and clear"
echo "   • Check that all form errors are announced"
echo "   • Test zoom functionality (200% zoom)"
echo "   • Verify content is readable in high contrast mode"

echo ""
echo "♿ Accessibility Audit Complete"
echo "================================"

if [ "$TEST_RESULT" = "PASS" ]; then
    print_status "PASS" "All automated accessibility tests passed"
    echo ""
    echo "Next Steps:"
    echo "• Review the generated report: reports/accessibility/summary.md"
    echo "• Perform manual accessibility testing"
    echo "• Consider adding accessibility testing to CI/CD pipeline"
else
    print_status "FAIL" "Accessibility issues found - review test failures"
    echo ""
    echo "Next Steps:"
    echo "• Fix failing accessibility tests"
    echo "• Review Playwright report for violation details"
    echo "• Implement accessibility improvements"
    echo "• Re-run audit after fixes"
fi

# Cleanup background processes
if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null || true
fi
if [ ! -z "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID 2>/dev/null || true
fi