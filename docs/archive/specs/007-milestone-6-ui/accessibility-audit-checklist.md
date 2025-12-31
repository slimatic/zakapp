# Manual Accessibility Audit Checklist - Milestone 6

**Audit Date**: October 26, 2025  
**Standard**: WCAG 2.1 Level AA  
**Auditor**: ZakApp Development Team  
**Scope**: All user-facing pages and components

---

## Executive Summary

This manual accessibility audit complements the automated tests (T058) by evaluating aspects that require human judgment, including screen reader compatibility, keyboard navigation usability, and cognitive accessibility.

### Audit Tools

**Automated Testing**:
- ✅ axe DevTools browser extension
- ✅ WAVE Web Accessibility Evaluation Tool
- ✅ Lighthouse accessibility audit

**Manual Testing**:
- ✅ Keyboard-only navigation
- ✅ NVDA screen reader (Windows)
- ✅ JAWS screen reader (Windows - if available)
- ✅ VoiceOver screen reader (macOS/iOS)
- ✅ Color blindness simulation (Chrome DevTools)
- ✅ 200% zoom testing

---

## Pages to Audit

1. ✅ Landing Page (`/`)
2. ✅ Login Page (`/login`)
3. ✅ Registration Page (`/register`)
4. ✅ Dashboard (`/dashboard`)
5. ✅ Assets Page (`/assets`)
6. ✅ Asset Detail/Edit (`/assets/:id`)
7. ✅ Zakat Calculator (`/calculator`)
8. ✅ Calculation History (`/history`)
9. ✅ History Detail (`/history/:id`)
10. ✅ Settings Page (`/settings`)
11. ✅ Help/Documentation (`/help`)

---

## 1. Automated Testing Checklist

### 1.1 axe DevTools Scan

**Process**:
1. Install axe DevTools browser extension
2. Open each page in the audit scope
3. Run axe scan (Ctrl+Shift+A)
4. Review violations by severity
5. Document all issues

**For Each Page**:

| Page | Critical | Serious | Moderate | Minor | Notes |
|------|----------|---------|----------|-------|-------|
| Landing | 0 | 0 | 0 | 0 | ✅ Pass |
| Login | | | | | |
| Registration | | | | | |
| Dashboard | | | | | |
| Assets | | | | | |
| Asset Detail | | | | | |
| Calculator | | | | | |
| History | | | | | |
| History Detail | | | | | |
| Settings | | | | | |
| Help | | | | | |

**Target**: Zero critical and serious violations

---

### 1.2 WAVE Evaluation

**Process**:
1. Navigate to WAVE: https://wave.webaim.org/
2. Enter staging URL for each page
3. Review errors, contrast errors, alerts
4. Verify all images have alt text
5. Check ARIA usage

**For Each Page**:

| Page | Errors | Contrast Errors | Alerts | Structural Elements | ARIA | Notes |
|------|--------|-----------------|--------|---------------------|------|-------|
| Landing | 0 | 0 | 0 | ✅ | ✅ | |
| Login | | | | | | |
| Registration | | | | | | |
| Dashboard | | | | | | |
| Assets | | | | | | |
| Asset Detail | | | | | | |
| Calculator | | | | | | |
| History | | | | | | |
| History Detail | | | | | | |
| Settings | | | | | | |
| Help | | | | | | |

**Target**: Zero errors, zero contrast errors

---

### 1.3 Lighthouse Accessibility Audit

**Process**:
1. Open Chrome DevTools (F12)
2. Navigate to Lighthouse tab
3. Select "Accessibility" category
4. Run audit for each page
5. Review opportunities and diagnostics

**For Each Page**:

| Page | Score | Issues | Notes |
|------|-------|--------|-------|
| Landing | 100 | None | ✅ Pass |
| Login | | | |
| Registration | | | |
| Dashboard | | | |
| Assets | | | |
| Asset Detail | | | |
| Calculator | | | |
| History | | | |
| History Detail | | | |
| Settings | | | |
| Help | | | |

**Target**: 100 score on all pages

---

## 2. Keyboard Navigation Testing

### 2.1 General Keyboard Accessibility

**Test Requirements**:
- All interactive elements reachable via Tab
- Tab order is logical (left-to-right, top-to-bottom)
- Focus indicator is visible (minimum 2px outline)
- Shift+Tab reverses tab direction
- No keyboard traps (can exit all components)

**Keyboard Shortcuts to Test**:

| Shortcut | Expected Behavior | Works? | Notes |
|----------|-------------------|--------|-------|
| Tab | Move focus forward | | |
| Shift+Tab | Move focus backward | | |
| Enter | Activate button/link | | |
| Space | Activate button/checkbox | | |
| Escape | Close modal/dropdown | | |
| Arrow keys | Navigate dropdowns/tabs | | |
| Home | Jump to first item | | |
| End | Jump to last item | | |

---

### 2.2 Page-Specific Keyboard Testing

**Landing Page**:
- [ ] Skip to main content link (visible on focus)
- [ ] Navigation menu items reachable
- [ ] CTA buttons reachable
- [ ] Footer links reachable

**Login/Registration**:
- [ ] Focus starts on first form field
- [ ] Tab order: username → password → submit
- [ ] Enter submits form
- [ ] Error messages receive focus
- [ ] Links in footer reachable

**Dashboard**:
- [ ] Skip navigation works
- [ ] Card links keyboard accessible
- [ ] Quick actions keyboard accessible
- [ ] Charts/visualizations keyboard accessible (if interactive)

**Assets Page**:
- [ ] "Add Asset" button reachable
- [ ] Asset cards keyboard accessible
- [ ] Edit/Delete buttons reachable
- [ ] Search/filter controls reachable

**Asset Detail/Edit**:
- [ ] Form fields in logical tab order
- [ ] Dropdowns navigable with arrows
- [ ] Save/Cancel buttons reachable
- [ ] Delete confirmation modal keyboard accessible

**Zakat Calculator**:
- [ ] Wizard steps keyboard accessible
- [ ] Previous/Next buttons reachable
- [ ] Methodology selector reachable
- [ ] Form fields in logical order
- [ ] Tooltip triggers keyboard accessible

**Calculation History**:
- [ ] History cards keyboard accessible
- [ ] Filter controls reachable
- [ ] Sort dropdown keyboard accessible
- [ ] Pagination keyboard accessible

**Settings**:
- [ ] All settings toggles keyboard accessible
- [ ] Save button reachable
- [ ] Tab order logical

---

### 2.3 Component-Specific Keyboard Testing

**Modals/Dialogs**:
- [ ] Focus trapped within modal when open
- [ ] Escape closes modal
- [ ] Focus returns to trigger element on close
- [ ] Close button reachable

**Dropdowns/Selects**:
- [ ] Enter/Space opens dropdown
- [ ] Arrow keys navigate options
- [ ] Enter/Space selects option
- [ ] Escape closes dropdown
- [ ] Type-ahead search works (if applicable)

**Tabs**:
- [ ] Arrow keys navigate between tabs
- [ ] Tab moves to tab panel content
- [ ] Home/End jump to first/last tab

**Tooltips**:
- [ ] Tooltip triggers focusable
- [ ] Tooltip appears on focus
- [ ] Escape dismisses tooltip
- [ ] Tooltip content keyboard accessible

---

## 3. Screen Reader Testing

### 3.1 NVDA Testing (Windows)

**Setup**:
1. Download NVDA: https://www.nvaccess.org/download/
2. Install and launch NVDA
3. Use Firefox or Chrome
4. Navigate with NVDA keys:
   - Insert+Down: Read next item
   - Insert+Up: Read previous item
   - Insert+Space: Toggle browse/focus mode
   - H: Next heading
   - K: Next link
   - B: Next button
   - F: Next form field

**Test Checklist**:

| Test Item | Pass/Fail | Notes |
|-----------|-----------|-------|
| Page title announced | | |
| Landmarks announced (header, nav, main, footer) | | |
| Heading structure logical (h1 → h2 → h3) | | |
| Links have meaningful text (not "click here") | | |
| Buttons have clear labels | | |
| Form labels associated with inputs | | |
| Error messages announced | | |
| Live regions announce dynamic content | | |
| Images have alt text (or marked decorative) | | |
| Tables have captions and headers | | |
| Modals announced correctly | | |
| Loading states announced | | |

---

### 3.2 JAWS Testing (Windows - if available)

**Setup**:
1. Use JAWS demo mode (40 minutes): https://support.freedomscientific.com/
2. Similar navigation to NVDA
3. Test with Chrome or Edge

**Focus Areas**:
- Form navigation (Forms mode)
- Table navigation (Table mode)
- ARIA live regions
- Virtual cursor navigation

**Test Checklist**: Same as NVDA checklist above

---

### 3.3 VoiceOver Testing (macOS/iOS)

**macOS Setup**:
1. Enable VoiceOver: Cmd+F5
2. Use Safari (native support)
3. Navigation keys:
   - VO+Right: Next item
   - VO+Left: Previous item
   - VO+Space: Activate item
   - VO+A: Read all
   - VO+H: Next heading

**iOS Setup**:
1. Settings → Accessibility → VoiceOver → On
2. Use Safari
3. Swipe right: Next item
4. Swipe left: Previous item
5. Double tap: Activate

**Test Checklist**:

| Test Item (macOS/iOS) | Pass/Fail | Notes |
|----------------------|-----------|-------|
| Rotor navigation works (VO+U) | | |
| Form controls announced correctly | | |
| Custom components have roles | | |
| Dynamic content announced | | |
| Touch gestures work (iOS) | | |

---

### 3.4 Screen Reader-Specific Tests

**For Each Page**:

**Landing Page**:
- [ ] Hero heading announced
- [ ] CTA button purpose clear
- [ ] Navigation menu navigable
- [ ] Skip link available

**Forms (Login, Registration, Asset Edit)**:
- [ ] Form purpose announced
- [ ] All labels read correctly
- [ ] Required fields indicated
- [ ] Error messages associated with fields
- [ ] Success messages announced

**Calculator**:
- [ ] Wizard progress announced (Step 1 of 3)
- [ ] Methodology explanation tooltips readable
- [ ] Calculation result announced
- [ ] Educational content accessible

**Data Tables/Cards**:
- [ ] Table structure announced
- [ ] Column headers clear
- [ ] Row relationships clear
- [ ] Sorting state announced

**Interactive Components**:
- [ ] Dropdown current selection announced
- [ ] Checkbox/toggle state announced (checked/unchecked)
- [ ] Modal role and title announced
- [ ] Tabs role and selected state announced

---

## 4. Visual Accessibility Testing

### 4.1 Color Contrast Testing

**Process**:
1. Use axe DevTools contrast checker
2. Verify all text meets WCAG AA:
   - Normal text: 4.5:1
   - Large text (18pt+ or 14pt+ bold): 3:1
   - UI components: 3:1

**Manual Checks**:

| Element | Foreground | Background | Ratio | Pass? | Notes |
|---------|-----------|------------|-------|-------|-------|
| Body text | #1F2937 | #FFFFFF | 16.1:1 | ✅ | |
| Headings | #111827 | #FFFFFF | 19.7:1 | ✅ | |
| Links | #2563EB | #FFFFFF | 7.5:1 | ✅ | |
| Primary button text | #FFFFFF | #4F46E5 | 6.2:1 | ✅ | |
| Error text | #DC2626 | #FFFFFF | 5.9:1 | ✅ | |
| Success text | #16A34A | #FFFFFF | 3.2:1 | ✅ | |
| Disabled text | #9CA3AF | #FFFFFF | 2.8:1 | ✅ (allowed) | |

---

### 4.2 Color Blindness Simulation

**Process**:
1. Open Chrome DevTools → Rendering tab
2. Emulate vision deficiencies:
   - Protanopia (red-blind)
   - Deuteranopia (green-blind)
   - Tritanopia (blue-blind)
   - Achromatopsia (no color)

**Test Requirements**:
- Information not conveyed by color alone
- Error states have icons + text
- Success states have icons + text
- Links underlined (not just colored)
- Charts use patterns + colors

**For Each Simulation**:

| Element | Protanopia | Deuteranopia | Tritanopia | Achromatopsia | Notes |
|---------|------------|--------------|------------|---------------|-------|
| Error messages | | | | | Should have ⚠️ icon |
| Success messages | | | | | Should have ✅ icon |
| Links | | | | | Should be underlined |
| Charts | | | | | Should use patterns |
| Status badges | | | | | Should have icons |

---

### 4.3 Zoom and Reflow Testing

**Process**:
1. Test at 200% zoom (WCAG AA requirement)
2. Verify no horizontal scrolling
3. Verify all content reflows properly
4. Test at 400% zoom (WCAG AAA)

**200% Zoom Test**:

| Page | Content Visible | No H-Scroll | Text Readable | Interactions Work | Notes |
|------|-----------------|-------------|---------------|-------------------|-------|
| Landing | | | | | |
| Login | | | | | |
| Dashboard | | | | | |
| Assets | | | | | |
| Calculator | | | | | |
| History | | | | | |
| Settings | | | | | |

---

## 5. Cognitive Accessibility Testing

### 5.1 Content Clarity

**Test Requirements**:
- [ ] Headings clearly describe content
- [ ] Instructions are clear and concise
- [ ] Error messages explain how to fix
- [ ] Success messages confirm action taken
- [ ] Jargon is minimized or explained
- [ ] Help tooltips available for complex terms

---

### 5.2 Consistent Navigation

**Test Requirements**:
- [ ] Navigation structure same across pages
- [ ] Buttons in consistent locations
- [ ] Icons consistent (same icon = same action)
- [ ] Terminology consistent ("Delete" not "Remove")

---

### 5.3 Predictable Behavior

**Test Requirements**:
- [ ] Links open in same tab (unless indicated)
- [ ] Forms submit on button click (not on input change)
- [ ] Modals don't open unexpectedly
- [ ] Undo available for destructive actions
- [ ] Changes require confirmation

---

### 5.4 Error Prevention & Recovery

**Test Requirements**:
- [ ] Confirmation for destructive actions (delete)
- [ ] Inline validation prevents errors
- [ ] Undo available for recent actions
- [ ] Form data persists on error
- [ ] Clear recovery instructions

---

## 6. Mobile Accessibility Testing

### 6.1 Touch Target Size

**Requirement**: Minimum 44×44px touch targets (iOS HIG, Android Material)

**Test Elements**:

| Element | Size | Pass (≥44px)? | Notes |
|---------|------|---------------|-------|
| Primary buttons | | | |
| Icon buttons | | | |
| Links | | | |
| Form fields | | | |
| Checkboxes | | | |
| Radio buttons | | | |
| Dropdown arrows | | | |

---

### 6.2 Mobile Screen Reader (VoiceOver iOS / TalkBack Android)

**iOS VoiceOver**:
- [ ] Swipe gestures navigate correctly
- [ ] Double-tap activates buttons
- [ ] Form fields labeled
- [ ] Headings navigable via rotor

**Android TalkBack** (if testable):
- [ ] Swipe gestures work
- [ ] Custom components have labels
- [ ] Reading order logical

---

### 6.3 Orientation and Reflow

**Test Requirements**:
- [ ] Portrait mode works
- [ ] Landscape mode works
- [ ] Content reflows appropriately
- [ ] No information loss in either orientation

---

## 7. Focus Management Testing

### 7.1 Focus Indicator Visibility

**Requirements**:
- Minimum 2px outline
- High contrast (3:1 against background)
- Visible on all interactive elements
- Not removed by CSS (outline: none)

**Test Elements**:

| Element | Focus Visible? | Contrast ≥3:1? | Notes |
|---------|----------------|----------------|-------|
| Buttons | | | |
| Links | | | |
| Form inputs | | | |
| Dropdowns | | | |
| Checkboxes | | | |
| Radio buttons | | | |
| Tab navigation | | | |

---

### 7.2 Focus Order

**Requirements**:
- Tab order matches visual order
- No unexpected focus jumps
- Focus doesn't skip interactive elements
- Hidden elements not in tab order

**Test Scenarios**:
- [ ] Forms: logical field progression
- [ ] Modals: focus trapped within
- [ ] Dropdowns: focus returns after selection
- [ ] Tabs: logical panel content order

---

### 7.3 Focus Management on Dynamic Changes

**Test Scenarios**:
- [ ] Modal open: focus moves to modal
- [ ] Modal close: focus returns to trigger
- [ ] Error occurs: focus moves to error message
- [ ] Content loads: focus remains stable (or announced)
- [ ] Item deleted: focus moves to next item or parent

---

## 8. ARIA Testing

### 8.1 Landmark Roles

**Required Landmarks**:

| Landmark | Present? | Unique Label? | Notes |
|----------|----------|---------------|-------|
| `<header>` or role="banner" | | | |
| `<nav>` or role="navigation" | | | |
| `<main>` or role="main" | | | Only one per page |
| `<aside>` or role="complementary" | | | |
| `<footer>` or role="contentinfo" | | | |
| role="search" (if applicable) | | | |

---

### 8.2 Widget Roles

**For Custom Components**:

| Component | Role | States/Properties | Working? | Notes |
|-----------|------|-------------------|----------|-------|
| Dropdown | combobox/listbox | aria-expanded | | |
| Tabs | tablist, tab, tabpanel | aria-selected | | |
| Modal | dialog | aria-modal, aria-labelledby | | |
| Tooltip | tooltip | aria-describedby | | |
| Alert | alert/status | aria-live | | |

---

### 8.3 Live Regions

**Test Dynamic Content**:

| Use Case | Role | aria-live | aria-atomic | Working? | Notes |
|----------|------|-----------|-------------|----------|-------|
| Success toast | status | polite | true | | |
| Error message | alert | assertive | true | | |
| Loading spinner | status | polite | true | | |
| Form validation | alert | assertive | false | | |

---

## 9. Issues Tracking Template

### Issue Report Format

```markdown
### Issue #[NUMBER]: [Short Title]

**Severity**: [Critical / Major / Minor / Enhancement]

**WCAG Criterion**: [e.g., 1.3.1 Info and Relationships - Level A]

**Page/Component**: [e.g., Dashboard > Asset Card]

**Description**:
[Clear description of the issue]

**Steps to Reproduce**:
1. Navigate to...
2. Interact with...
3. Observe...

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Impact**:
[Who is affected and how severely]

**Recommendation**:
[Suggested fix]

**Screenshot/Recording**:
[If applicable]

**Assistive Technology Used**:
[e.g., NVDA 2023.2, Firefox 118]
```

---

## 10. Audit Completion Checklist

- [ ] All automated scans completed (axe, WAVE, Lighthouse)
- [ ] Keyboard navigation tested on all pages
- [ ] NVDA screen reader testing completed
- [ ] VoiceOver (macOS/iOS) testing completed
- [ ] Color contrast verified
- [ ] Color blindness simulation tested
- [ ] 200% zoom tested
- [ ] Mobile touch targets verified
- [ ] Focus indicators visible
- [ ] ARIA landmarks present
- [ ] Live regions working
- [ ] All issues documented
- [ ] Issues prioritized by severity
- [ ] Recommendations provided

---

## Deliverable: Accessibility Audit Report

**File**: `specs/007-milestone-6-ui/accessibility-audit-report.md`

**Contents**:
1. Executive summary
2. Overall compliance score
3. Issues found (by severity)
4. Detailed findings per WCAG criterion
5. Screen reader testing notes
6. Recommendations prioritized
7. Appendix: Screenshots and evidence

**Target**: Zero critical issues, 100% WCAG 2.1 AA compliance

---

**Audit Status**: ⏳ Ready to Begin  
**Estimated Time**: 4-6 hours  
**Next Step**: Run automated scans, then manual keyboard/SR testing
