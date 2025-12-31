# Phase 3.6 Validation Scripts

Automated test execution scripts for validating the Nisab Year Record feature implementation.

## Overview

This directory contains automated test scripts for Phase 3.6 validation tasks (T067-T087):

- **Performance Tests** (T074-T078): Verify performance benchmarks
- **Accessibility Tests** (T079-T083): WCAG 2.1 AA compliance audits
- **Islamic Compliance** (T084-T087): Verify Zakat calculation accuracy

## Quick Start

### Run All Tests

```bash
./run-validation.sh
```

This will execute all automated tests in sequence and provide a summary report.

### Run Specific Test Suites

```bash
# Performance tests only
./run-validation.sh --performance-only

# Accessibility tests only
./run-validation.sh --accessibility-only

# Islamic compliance only
./run-validation.sh --compliance-only
```

### Skip Specific Test Suites

```bash
# Skip accessibility (when frontend not running)
./run-validation.sh --skip-accessibility

# Skip performance (for quick compliance checks)
./run-validation.sh --skip-performance
```

### Verbose Output

```bash
# Show detailed output from each test
./run-validation.sh --verbose
```

## Individual Scripts

### 1. Performance Tests (`performance-tests.sh`)

Tests performance benchmarks required by constitutional principles:

- **T074**: Wealth aggregation (<100ms for 500 assets)
- **T075**: Precious metals API (<2s with cache fallback)
- **T076**: Dashboard page load (<2s constitutional requirement)
- **T077**: Live tracking latency (<500ms perceived as instant)
- **T078**: Background Hawl detection job (<30s completion)

**Prerequisites:**
- Backend server running on port 3000
- Frontend server running on port 5173 (for T076)
- Test user account available

**Run:**
```bash
./performance-tests.sh
```

### 2. Accessibility Tests (`accessibility-tests.sh`)

WCAG 2.1 AA compliance audits for all React components:

- **T079**: HawlProgressIndicator (keyboard nav, screen reader, contrast)
- **T080**: NisabComparisonWidget (alt text, ARIA labels)
- **T081**: FinalizationModal (focus trap, ESC key, announcements)
- **T082**: UnlockReasonDialog (error announcements, label associations)
- **T083**: AuditTrailView (semantic HTML, color contrast)

**Prerequisites:**
- Frontend server running on port 5173
- `@axe-core/cli` and `pa11y` installed (script will auto-install)

**Run:**
```bash
./accessibility-tests.sh
```

**Note:** Some tests require manual verification. The script provides detailed checklists.

### 3. Islamic Compliance (`islamic-compliance.sh`)

Verifies Zakat calculations align with Islamic principles:

- **T084**: Nisab thresholds (87.48g gold, 612.36g silver)
- **T085**: Hawl duration (354 days lunar year)
- **T086**: Zakat rate (2.5% on entire base, not excess)
- **T087**: Educational content aligns with Simple Zakat Guide

**Prerequisites:**
- Source code available (no servers required)

**Run:**
```bash
./islamic-compliance.sh
```

## Test Results

Test logs are saved to `/tmp/`:
- `/tmp/performance-tests.log`
- `/tmp/accessibility-tests.log`
- `/tmp/islamic-compliance.log`

Individual test artifacts:
- `/tmp/a11y-*.json` - Accessibility audit results
- `/tmp/lighthouse-dashboard.json` - Lighthouse performance report
- `/tmp/test-*.js` - Generated test scripts

## Exit Codes

All scripts use standard exit codes:
- `0`: All tests passed
- `1`: One or more tests failed

## Manual Testing

Automated scripts cover Tasks T074-T087. Manual testing is still required for:

### Quickstart Scenarios (T067-T073)

Follow the manual testing guide:
```bash
cat ../quickstart.md
```

**Scenarios:**
1. First-time Nisab achievement & Hawl start (~10 min)
2. Live tracking during Hawl (~8 min)
3. Wealth falls below Nisab (interruption) (~7 min)
4. Hawl completion & finalization (~10 min)
5. Unlock & edit finalized record (~8 min)
6. Invalid operations (error handling) (~5 min)
7. Nisab threshold calculation (~7 min)

### Accessibility Manual Checks

After running `accessibility-tests.sh`, complete the manual checklists:

1. **Keyboard Navigation**: Tab through all interactive elements
2. **Screen Reader Testing**: Test with NVDA, JAWS, or VoiceOver
3. **Focus Management**: Verify visible focus indicators
4. **Color Contrast**: Use browser DevTools to verify ratios
5. **ARIA Attributes**: Inspect elements for proper ARIA usage

## Integration with Tasks

After completing validation:

1. Mark completed tasks in `../tasks.md`:
   ```markdown
   - [x] T074 Performance test: Aggregate wealth calculation ✅ PASS
   - [x] T075 Performance test: Precious metals API ✅ PASS
   ...
   ```

2. Commit validation results:
   ```bash
   git add -A
   git commit -m "test: Phase 3.6 validation complete"
   ```

3. Proceed to Phase 3.7 (Documentation - T088-T091)

## Troubleshooting

### Servers Not Running

**Error:** `Backend server not running on port 3000`

**Solution:**
```bash
# From repo root
npm run server:dev
```

**Error:** `Frontend not running on port 5173`

**Solution:**
```bash
# From repo root
npm run dev
# Or from client directory
cd client && npm run dev
```

### Missing Dependencies

**Error:** `command not found: axe` or `command not found: pa11y`

**Solution:**
```bash
npm install -g @axe-core/cli pa11y
```

### Permission Denied

**Error:** `Permission denied: ./run-validation.sh`

**Solution:**
```bash
chmod +x *.sh
```

### Test Failures

1. **Review log files** in `/tmp/` for detailed error messages
2. **Run with verbose flag**: `./run-validation.sh --verbose`
3. **Run individual scripts** to isolate issues
4. **Check prerequisites** (servers running, dependencies installed)

## Constitutional Principles

These tests validate adherence to ZakApp's constitutional principles:

1. **Professional & Modern UX**: Performance tests ensure <2s page loads
2. **Privacy & Security First**: No sensitive data logged in tests
3. **Spec-Driven Development**: All tests based on spec.md requirements
4. **Quality & Performance**: >90% coverage, <2s loads, WCAG 2.1 AA
5. **Islamic Guidance**: Compliance tests verify scholarly alignment

## References

- **Feature Spec**: `../spec.md`
- **Tasks Breakdown**: `../tasks.md`
- **Quickstart Guide**: `../quickstart.md`
- **API Contracts**: `../contracts/`
- **Constitutional Principles**: `/.specify/memory/constitution.md`
- **Simple Zakat Guide**: Referenced in Islamic compliance tests

## Support

For issues or questions:
1. Review this README
2. Check individual script comments
3. Review task specifications in `../tasks.md`
4. Consult feature spec: `../spec.md`
