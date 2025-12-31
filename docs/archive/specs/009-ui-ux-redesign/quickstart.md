# Quickstart Guide: UI/UX Redesign Testing

**Feature**: 009-ui-ux-redesign  
**Purpose**: Manual testing scenarios to validate the redesigned navigation and user experience  
**Prerequisites**: Feature implementation complete, test environment running

## Testing Environment Setup

```bash
# Start development environment
cd /home/lunareclipse/zakapp
npm run dev

# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

**Test User Credentials**:
- Email: `test@zakapp.com`
- Password: `TestPassword123!`

---

## Scenario 1: New User First Login Experience (~ 8 minutes)

**Goal**: Verify new users can immediately understand the app and navigate the primary workflow.

### Prerequisites
- Fresh user account with no assets or records
- Clear browser cache to simulate first-time experience

### Steps

1. **Login to Application**
   - Navigate to http://localhost:3000
   - Login with test credentials
   - **Expected**: Redirect to `/dashboard`

2. **Verify Dashboard Welcome State**
   - **Expected Results**:
     - ✅ Welcome message: "Welcome to ZakApp - Your Islamic Zakat Calculator"
     - ✅ Empty state shows onboarding guidance
     - ✅ 3-step guide visible: "Add Assets → Create Record → Track Zakat"
     - ✅ Prominent "Add Your First Asset" CTA button
     - ✅ Educational module: "Understanding Zakat & Nisab" (collapsible)

3. **Verify Simplified Navigation**
   - **Expected Results**:
     - ✅ Only 4 navigation items visible: Dashboard, Assets, Nisab Records, Profile
     - ✅ "Calculate Zakat" NOT in navigation
     - ✅ "Tracking Analytics" NOT in navigation
     - ✅ "History" NOT in navigation
     - ✅ "Dashboard" has active state indicator (background color + underline)

4. **Test Mobile Navigation (Responsive)**
   - Resize browser to mobile width (<768px)
   - **Expected Results**:
     - ✅ Hamburger menu icon appears (top left)
     - ✅ Main navigation collapses
     - ✅ Bottom navigation bar appears with 4 icons
     - ✅ Tap hamburger → Full menu slides in
     - ✅ Tap outside menu → Menu closes

5. **Follow Onboarding Flow**
   - Click "Add Your First Asset" button
   - **Expected**: Navigate to `/assets` page
   - Add a test asset (Cash: $10,000)
   - Return to Dashboard (click "Dashboard" in nav)
   - **Expected**: 
     - ✅ Wealth summary card now shows "$10,000"
     - ✅ New prompt: "You have $10,000 in assets. Ready to start tracking Zakat?"
     - ✅ "Create Nisab Record" button now prominent

6. **Verify Keyboard Navigation**
   - Press Tab repeatedly
   - **Expected**:
     - ✅ Focus moves through navigation items (Dashboard → Assets → Nisab Records → Profile)
     - ✅ Focus indicator clearly visible (2px outline)
     - ✅ Press Enter on focused link → Navigates to that page
     - ✅ Skip link appears at top ("Skip to main content")

### Success Criteria
- [ ] New user sees clear welcome and guidance
- [ ] Navigation is simplified (4 items only)
- [ ] Onboarding flow is intuitive
- [ ] Mobile responsive navigation works
- [ ] Keyboard navigation is fully functional
- [ ] No broken links or console errors

---

## Scenario 2: Returning User with Active Record (~ 7 minutes)

**Goal**: Verify returning users see status overview and quick actions.

### Prerequisites
- User account with:
  - Multiple assets (total wealth > Nisab)
  - Active Nisab Year Record (in progress)

### Steps

1. **Login and View Dashboard**
   - Login to application
   - **Expected**: Land on `/dashboard`

2. **Verify Active Record Widget**
   - **Expected Results**:
     - ✅ Large status card showing active Nisab Year Record
     - ✅ Hawl progress indicator (e.g., "Day 45 of 354 - 309 days remaining")
     - ✅ Visual progress bar (filled percentage)
     - ✅ Current wealth vs Nisab threshold comparison
     - ✅ Status: "Above Nisab by $X" in green (or yellow/red if near/below)

3. **Verify Quick Action Cards**
   - **Expected Results**:
     - ✅ "Add Asset" button visible
     - ✅ "View All Records" button links to `/nisab-records`
     - ✅ "Update Assets" button links to `/assets`
     - ✅ Each card has icon + clear label

4. **Test Navigation to Nisab Records**
   - Click "Nisab Records" in main navigation
   - **Expected**: Navigate to `/nisab-records` page
   - **Verify**:
     - ✅ Nisab Records page loads successfully
     - ✅ Active record is visible in list
     - ✅ "Nisab Records" has active state in navigation

5. **Verify Removed Pages Are Inaccessible**
   - Manually type `/calculate` in URL bar
   - **Expected**: Redirect to `/dashboard` or 404 page
   - Manually type `/tracking` in URL bar
   - **Expected**: Redirect to `/dashboard` or 404 page
   - Manually type `/history` in URL bar
   - **Expected**: Redirect to `/dashboard` or 404 page (hidden until implemented)

6. **Test Navigation Performance**
   - Click between Dashboard, Assets, Nisab Records rapidly
   - **Expected**:
     - ✅ Navigation response feels instant (<100ms perceived)
     - ✅ No loading spinners for navigation (SPA behavior)
     - ✅ Active state updates immediately
     - ✅ No console errors or warnings

### Success Criteria
- [ ] Active record status prominently displayed
- [ ] Quick actions easily accessible
- [ ] Nisab Records page in navigation and functional
- [ ] Old routes (/calculate, /tracking, /history) inaccessible
- [ ] Navigation performance feels instant
- [ ] No broken functionality from removed pages

---

## Scenario 3: Accessibility Testing (~ 10 minutes)

**Goal**: Verify WCAG 2.1 AA compliance for navigation and dashboard.

### Prerequisites
- Screen reader software installed (NVDA on Windows, VoiceOver on Mac)
- Browser with accessibility dev tools (Chrome Lighthouse)

### Steps

1. **Keyboard Navigation Test**
   - Do NOT use mouse
   - Press Tab to navigate through all interactive elements
   - **Expected**:
     - ✅ All navigation items reachable via Tab
     - ✅ Skip link appears first: "Skip to main content"
     - ✅ Focus order is logical (top to bottom, left to right)
     - ✅ No keyboard traps (can Tab forward and Shift+Tab backward)
     - ✅ Press Enter on links → Navigation works
     - ✅ Press Escape on mobile menu → Menu closes

2. **Focus Indicator Test**
   - Tab through navigation items
   - **Expected**:
     - ✅ Each focused element has visible outline (2px minimum)
     - ✅ Outline has 4.5:1 contrast ratio against background
     - ✅ Focus indicator is not hidden by CSS

3. **Color Contrast Test**
   - Use browser dev tools → Inspect navigation text
   - **Expected**:
     - ✅ Default nav text: 4.5:1 minimum contrast (gray-600 on white)
     - ✅ Active nav text: 4.5:1 minimum contrast (green-700 on green-100)
     - ✅ Hover state: 4.5:1 minimum contrast
     - ✅ Icons have 3:1 minimum contrast

4. **Screen Reader Test (Basic)**
   - Enable screen reader (NVDA or VoiceOver)
   - Navigate through page
   - **Expected**:
     - ✅ Navigation announced as "Main navigation" landmark
     - ✅ Active page announced: "Dashboard, current page"
     - ✅ Links announced with meaningful text (not "click here")
     - ✅ Buttons announced with clear purpose
     - ✅ Headings have proper hierarchy (H1 → H2 → H3)

5. **Mobile Touch Target Test**
   - Resize to mobile (<768px)
   - Use browser dev tools → Inspect navigation items
   - **Expected**:
     - ✅ Bottom navigation icons are 44x44px minimum
     - ✅ Hamburger menu button is 48x48px minimum
     - ✅ 8px spacing between interactive elements
     - ✅ No overlapping hit areas

6. **Lighthouse Accessibility Audit**
   - Open Chrome DevTools → Lighthouse tab
   - Run Accessibility audit
   - **Expected**:
     - ✅ Accessibility score ≥ 95/100
     - ✅ No critical errors (missing alt text, insufficient contrast)
     - ✅ All form inputs have labels
     - ✅ All buttons have accessible names

### Success Criteria
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators clearly visible (4.5:1 contrast)
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- [ ] Screen reader can navigate and announce properly
- [ ] Touch targets meet minimum 44x44px size
- [ ] Lighthouse accessibility score ≥ 95

---

## Scenario 4: Mobile Responsive Layout (~ 6 minutes)

**Goal**: Verify navigation and dashboard work seamlessly on mobile, tablet, and desktop.

### Prerequisites
- Browser with responsive design mode (Chrome DevTools)

### Steps

1. **Test Mobile Layout (<768px)**
   - Set viewport to iPhone 12 (390x844)
   - **Expected Results**:
     - ✅ Hamburger menu visible (top left)
     - ✅ Bottom navigation bar with 4 icons
     - ✅ Dashboard cards stack vertically
     - ✅ Navigation menu slides in from left
     - ✅ Tap outside menu → Menu closes

2. **Test Tablet Layout (768-1024px)**
   - Set viewport to iPad (768x1024)
   - **Expected Results**:
     - ✅ Horizontal navigation with icons + text
     - ✅ Dashboard cards in 2-column grid
     - ✅ No hamburger menu (full nav visible)

3. **Test Desktop Layout (>1024px)**
   - Set viewport to 1920x1080
   - **Expected Results**:
     - ✅ Full horizontal navigation with text labels
     - ✅ Dashboard cards in 3-column grid
     - ✅ No bottom navigation bar

4. **Test Orientation Change (Mobile)**
   - Set to iPhone 12 portrait → Rotate to landscape
   - **Expected**:
     - ✅ Layout adapts smoothly
     - ✅ Navigation remains functional
     - ✅ No content cut off or overlapping

5. **Test Touch Interactions (Mobile)**
   - Enable touch simulation in DevTools
   - **Expected**:
     - ✅ Tap navigation items → Navigate successfully
     - ✅ Swipe on mobile menu → Closes (if implemented)
     - ✅ No hover-only interactions (all work on touch)

### Success Criteria
- [ ] Mobile layout uses hamburger + bottom nav
- [ ] Tablet layout uses horizontal nav
- [ ] Desktop layout uses full navigation
- [ ] Cards reflow appropriately at each breakpoint
- [ ] Touch interactions work without mouse
- [ ] No layout breaking or content overflow

---

## Scenario 5: Performance Validation (~ 7 minutes)

**Goal**: Verify navigation performance meets <2s page load, <100ms response targets.

### Prerequisites
- Chrome DevTools Performance tab
- Stable internet connection

### Steps

1. **Initial Page Load Test**
   - Clear browser cache
   - Open DevTools → Network tab
   - Navigate to http://localhost:3000/dashboard
   - **Expected**:
     - ✅ First Contentful Paint (FCP) < 1.5s
     - ✅ Time to Interactive (TTI) < 3s
     - ✅ Total page load < 2s

2. **Navigation Transition Test**
   - Record performance in DevTools
   - Click Dashboard → Assets → Nisab Records → Dashboard
   - Stop recording
   - **Expected**:
     - ✅ Each navigation feels instant (<100ms perceived)
     - ✅ No visible loading spinners between routes
     - ✅ Active state updates immediately

3. **Lighthouse Performance Audit**
   - Open Chrome DevTools → Lighthouse
   - Run Performance audit (Mobile + Desktop)
   - **Expected**:
     - ✅ Performance score ≥ 90/100 (mobile)
     - ✅ Performance score ≥ 95/100 (desktop)
     - ✅ FCP < 1.5s
     - ✅ LCP < 2.5s
     - ✅ CLS < 0.1

4. **Skeleton Loading Test**
   - Enable Chrome DevTools → Network → Slow 3G throttling
   - Navigate to Dashboard
   - **Expected**:
     - ✅ Skeleton screens appear immediately (not blank page)
     - ✅ Content-aware skeletons match final layout
     - ✅ No layout shift when real content loads (CLS < 0.1)

5. **Bundle Size Check**
   - Run `npm run build` (production build)
   - Check build output for bundle sizes
   - **Expected**:
     - ✅ Main bundle < 250KB gzipped
     - ✅ Navigation component < 10KB gzipped
     - ✅ Dashboard page < 50KB gzipped

### Success Criteria
- [ ] Initial page load < 2s
- [ ] Navigation response < 100ms perceived
- [ ] Lighthouse performance score ≥ 90 (mobile), ≥ 95 (desktop)
- [ ] Skeleton screens reduce perceived wait time
- [ ] Bundle sizes within acceptable range
- [ ] No performance regressions vs baseline

---

## Scenario 6: Edge Cases & Error Handling (~ 5 minutes)

**Goal**: Verify graceful handling of edge cases and errors.

### Prerequisites
- Test account with various data states

### Steps

1. **Empty State Handling**
   - Login with account that has NO assets
   - **Expected**: Dashboard shows "Add Your First Asset" onboarding
   - Login with account that has assets but NO Nisab records
   - **Expected**: Dashboard shows "Create Nisab Record" prompt

2. **Direct URL Access**
   - Type `/nisab-records` directly in URL bar (while logged out)
   - **Expected**: Redirect to `/login` with return URL preserved
   - Login → **Expected**: Redirect back to `/nisab-records`

3. **Browser Back/Forward**
   - Navigate: Dashboard → Assets → Nisab Records
   - Press browser Back button twice
   - **Expected**: Back to Dashboard, active state correct
   - Press browser Forward button
   - **Expected**: Forward to Assets, active state correct

4. **Network Error Handling**
   - Enable Chrome DevTools → Network → Offline mode
   - Try to navigate between pages
   - **Expected**:
     - ✅ Offline message displayed (if PWA implemented)
     - ✅ Navigation doesn't break or show blank pages
     - ✅ Graceful error message if data can't load

5. **Console Error Check**
   - Open Chrome DevTools → Console
   - Navigate through all pages
   - **Expected**:
     - ✅ No React errors or warnings
     - ✅ No 404 errors for missing resources
     - ✅ No CORS errors
     - ✅ Only expected informational logs

### Success Criteria
- [ ] Empty states show helpful onboarding
- [ ] Direct URL access works with proper redirects
- [ ] Browser back/forward navigation works
- [ ] Network errors handled gracefully
- [ ] No console errors during normal usage

---

## Test Execution Checklist

### Pre-Testing
- [ ] Development environment running (frontend + backend)
- [ ] Test user account created with known credentials
- [ ] Browser cache cleared for fresh state tests
- [ ] Screen reader software available (if testing accessibility)

### Scenario Execution
- [ ] Scenario 1: New User First Login (8 min)
- [ ] Scenario 2: Returning User with Active Record (7 min)
- [ ] Scenario 3: Accessibility Testing (10 min)
- [ ] Scenario 4: Mobile Responsive Layout (6 min)
- [ ] Scenario 5: Performance Validation (7 min)
- [ ] Scenario 6: Edge Cases & Error Handling (5 min)

**Total Testing Time**: ~43 minutes

### Post-Testing
- [ ] Document all issues found in GitHub issues
- [ ] Take screenshots of any visual bugs
- [ ] Save Lighthouse reports for performance baseline
- [ ] Update this document with any new test cases discovered

---

## Expected Issues (Known Limitations)

These are NOT bugs - they are known limitations or future enhancements:

1. **History page still in code**: File exists but no route. This is intentional until History feature is implemented.
2. **Calculate/Tracking pages**: Old code may remain but routes removed. Clean up in future refactor.
3. **Mobile menu animations**: May not have fancy animations in MVP - functionality over polish initially.

---

## Success Criteria Summary

**Feature is ready for production when**:
- ✅ All 6 scenarios pass without critical issues
- ✅ Navigation is simplified to 4 items
- ✅ Nisab Records accessible from main navigation
- ✅ Calculate/Tracking/History pages removed from navigation
- ✅ Dashboard serves as central hub with status + actions
- ✅ WCAG 2.1 AA accessibility compliance verified
- ✅ Mobile responsive design works on all breakpoints
- ✅ Performance targets met (< 2s load, < 100ms nav)
- ✅ No breaking changes to existing functionality
- ✅ Zero critical console errors

**Report any blockers immediately to development team.**

---

## Contact & Support

- **Feature Owner**: Development Team
- **Testing Questions**: Refer to spec.md and research.md in this directory
- **Bug Reporting**: Create GitHub issue with label `009-ui-ux-redesign`
