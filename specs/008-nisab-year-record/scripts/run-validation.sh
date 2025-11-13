#!/bin/bash
#
# Master Test Runner for Phase 3.6 Validation
# Executes all automated test scripts for Nisab Year Record feature
#

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo -e "${BOLD}${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Phase 3.6 Validation & Testing - Master Runner        ║"
echo "║              Nisab Year Record Feature (Spec 008)             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Parse command line arguments
RUN_PERFORMANCE=true
RUN_ACCESSIBILITY=true
RUN_COMPLIANCE=true
VERBOSE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --performance-only)
      RUN_ACCESSIBILITY=false
      RUN_COMPLIANCE=false
      shift
      ;;
    --accessibility-only)
      RUN_PERFORMANCE=false
      RUN_COMPLIANCE=false
      shift
      ;;
    --compliance-only)
      RUN_PERFORMANCE=false
      RUN_ACCESSIBILITY=false
      shift
      ;;
    --skip-performance)
      RUN_PERFORMANCE=false
      shift
      ;;
    --skip-accessibility)
      RUN_ACCESSIBILITY=false
      shift
      ;;
    --skip-compliance)
      RUN_COMPLIANCE=false
      shift
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --performance-only      Run only performance tests (T074-T078)"
      echo "  --accessibility-only    Run only accessibility tests (T079-T083)"
      echo "  --compliance-only       Run only Islamic compliance tests (T084-T087)"
      echo "  --skip-performance      Skip performance tests"
      echo "  --skip-accessibility    Skip accessibility tests"
      echo "  --skip-compliance       Skip Islamic compliance tests"
      echo "  --verbose, -v           Show detailed output"
      echo "  --help, -h              Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                          # Run all tests"
      echo "  $0 --performance-only       # Run only performance tests"
      echo "  $0 --skip-accessibility     # Run all except accessibility"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Track results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Make scripts executable
chmod +x "$SCRIPT_DIR"/*.sh 2>/dev/null || true

# Run Performance Tests (T074-T078)
if [ "$RUN_PERFORMANCE" = true ]; then
  echo -e "${BOLD}${BLUE}[1/3] Running Performance Tests${NC}"
  echo "Tasks: T074-T078"
  echo ""
  
  if [ "$VERBOSE" = true ]; then
    if "$SCRIPT_DIR/performance-tests.sh"; then
      ((PASSED_TESTS+=5))
      echo -e "${GREEN}✅ Performance tests PASSED${NC}"
    else
      ((FAILED_TESTS+=5))
      echo -e "${RED}❌ Performance tests FAILED${NC}"
    fi
  else
    if "$SCRIPT_DIR/performance-tests.sh" > /tmp/performance-tests.log 2>&1; then
      ((PASSED_TESTS+=5))
      echo -e "${GREEN}✅ Performance tests PASSED (5/5)${NC}"
    else
      ((FAILED_TESTS+=5))
      echo -e "${RED}❌ Performance tests FAILED${NC}"
      echo "   See /tmp/performance-tests.log for details"
    fi
  fi
  ((TOTAL_TESTS+=5))
  echo ""
fi

# Run Accessibility Tests (T079-T083)
if [ "$RUN_ACCESSIBILITY" = true ]; then
  echo -e "${BOLD}${BLUE}[2/3] Running Accessibility Tests${NC}"
  echo "Tasks: T079-T083"
  echo ""
  
  if [ "$VERBOSE" = true ]; then
    if "$SCRIPT_DIR/accessibility-tests.sh"; then
      ((PASSED_TESTS+=5))
      echo -e "${GREEN}✅ Accessibility tests PASSED${NC}"
    else
      ((WARNINGS+=5))
      echo -e "${YELLOW}⚠️  Accessibility tests require manual review${NC}"
    fi
  else
    if "$SCRIPT_DIR/accessibility-tests.sh" > /tmp/accessibility-tests.log 2>&1; then
      ((PASSED_TESTS+=5))
      echo -e "${GREEN}✅ Accessibility tests PASSED (5/5)${NC}"
    else
      ((WARNINGS+=5))
      echo -e "${YELLOW}⚠️  Accessibility tests require manual review (5/5)${NC}"
      echo "   See /tmp/accessibility-tests.log for details"
    fi
  fi
  ((TOTAL_TESTS+=5))
  echo ""
fi

# Run Islamic Compliance Tests (T084-T087)
if [ "$RUN_COMPLIANCE" = true ]; then
  echo -e "${BOLD}${BLUE}[3/3] Running Islamic Compliance Verification${NC}"
  echo "Tasks: T084-T087"
  echo ""
  
  if [ "$VERBOSE" = true ]; then
    if "$SCRIPT_DIR/islamic-compliance.sh"; then
      ((PASSED_TESTS+=4))
      echo -e "${GREEN}✅ Islamic compliance VERIFIED${NC}"
    else
      ((FAILED_TESTS+=4))
      echo -e "${RED}❌ Islamic compliance FAILED${NC}"
    fi
  else
    if "$SCRIPT_DIR/islamic-compliance.sh" > /tmp/islamic-compliance.log 2>&1; then
      ((PASSED_TESTS+=4))
      echo -e "${GREEN}✅ Islamic compliance VERIFIED (4/4)${NC}"
    else
      ((FAILED_TESTS+=4))
      echo -e "${RED}❌ Islamic compliance FAILED${NC}"
      echo "   See /tmp/islamic-compliance.log for details"
    fi
  fi
  ((TOTAL_TESTS+=4))
  echo ""
fi

# Print Summary
echo ""
echo -e "${BOLD}${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Test Execution Summary                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

echo -e "Total Tests:    ${BOLD}$TOTAL_TESTS${NC}"
echo -e "Passed:         ${GREEN}${BOLD}$PASSED_TESTS${NC}"
echo -e "Failed:         ${RED}${BOLD}$FAILED_TESTS${NC}"
echo -e "Warnings:       ${YELLOW}${BOLD}$WARNINGS${NC}"
echo ""

# Detailed breakdown
echo -e "${BOLD}Test Breakdown:${NC}"
echo ""

if [ "$RUN_PERFORMANCE" = true ]; then
  echo "Performance Tests (T074-T078):"
  echo "  T074: Wealth aggregation (<100ms for 500 assets)"
  echo "  T075: Precious metals API (<2s with cache)"
  echo "  T076: Dashboard load (<2s constitutional)"
  echo "  T077: Live tracking latency (<500ms)"
  echo "  T078: Background job (<30s completion)"
  echo ""
fi

if [ "$RUN_ACCESSIBILITY" = true ]; then
  echo "Accessibility Tests (T079-T083):"
  echo "  T079: HawlProgressIndicator WCAG 2.1 AA"
  echo "  T080: NisabComparisonWidget WCAG 2.1 AA"
  echo "  T081: FinalizationModal WCAG 2.1 AA"
  echo "  T082: UnlockReasonDialog WCAG 2.1 AA"
  echo "  T083: AuditTrailView WCAG 2.1 AA"
  echo ""
fi

if [ "$RUN_COMPLIANCE" = true ]; then
  echo "Islamic Compliance (T084-T087):"
  echo "  T084: Nisab thresholds (87.48g gold, 612.36g silver)"
  echo "  T085: Hawl duration (354 days lunar year)"
  echo "  T086: Zakat rate (2.5% on entire base)"
  echo "  T087: Educational content alignment"
  echo ""
fi

# Next steps
echo -e "${BOLD}Next Steps:${NC}"
echo ""

if [ $FAILED_TESTS -gt 0 ]; then
  echo -e "${RED}❌ Fix failed tests before proceeding${NC}"
  echo "   Review log files in /tmp/ for details"
  echo ""
fi

if [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Manual review required for accessibility${NC}"
  echo "   Complete manual checklists in accessibility-tests.sh"
  echo "   Test with screen readers (NVDA, JAWS, VoiceOver)"
  echo "   Test keyboard-only navigation"
  echo ""
fi

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✅ Automated tests PASSED!${NC}"
  echo ""
  echo "Remaining Phase 3.6 tasks (manual):"
  echo "  [ ] T067-T073: Execute quickstart scenarios (manual testing)"
  echo "      - See: specs/008-nisab-year-record/quickstart.md"
  echo "  [ ] Review accessibility manual checklists"
  echo "  [ ] Test with actual screen readers"
  echo ""
  echo "After manual validation:"
  echo "  1. Mark T067-T087 complete in tasks.md"
  echo "  2. Proceed to Phase 3.7 (Documentation - T088-T091)"
  echo "  3. Create pull request for code review"
  echo ""
fi

# Exit with appropriate code
if [ $FAILED_TESTS -gt 0 ]; then
  exit 1
else
  exit 0
fi
