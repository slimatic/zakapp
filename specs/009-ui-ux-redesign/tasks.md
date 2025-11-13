# Tasks: UI/UX Redesign - Sitemap, Navigation, and User Flow Optimization

**Feature Branch**: `009-ui-ux-redesign`  
**Input**: Design documents from `/home/lunareclipse/zakapp/specs/009-ui-ux-redesign/`  
**Prerequisites**: ✅ plan.md, ✅ research.md, ✅ quickstart.md (no data-model.md or contracts/ - frontend-only)

## Execution Flow (main)
```
1. ✅ Load plan.md from feature directory
   → Extracted: TypeScript 4.9+, React 18+, React Router v6, Tailwind CSS 3.x
   → Project Type: Web (frontend-only changes)
2. ✅ Load optional design documents:
   → research.md: Navigation architecture, responsive patterns, accessibility
   → quickstart.md: 6 testing scenarios (~43 min total)
   → No data-model.md: Frontend-only, no database changes
   → No contracts/: No API changes
3. ✅ Generate tasks by category:
   → Setup: Environment review, route audit
   → Component Creation: 12 new/updated components
   → Route Consolidation: Remove Calculate/Tracking, hide History, add Nisab Records
   → Dashboard Refactor: New widgets and onboarding
   → Responsive Styling: Mobile/tablet/desktop breakpoints
   → Accessibility: WCAG 2.1 AA compliance
   → Testing: Unit tests, E2E tests, manual testing
   → Documentation: README updates, code cleanup
4. ✅ Apply task rules:
   → Component creation = parallel [P] (different files)
   → Route changes = sequential (same App.tsx file)
   → Dashboard refactor = sequential (same Dashboard.tsx file)
   → Tests = parallel [P] per test file
5. ✅ Number tasks sequentially (T001-T052)
6. ✅ Generate dependency graph
7. ✅ Create parallel execution examples
8. ✅ Validate task completeness:
   → All components have creation tasks ✅
   → All test scenarios have test tasks ✅
   → All routes have consolidation tasks ✅
9. ✅ Return: SUCCESS (52 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
**Web app structure** (from plan.md):
```
client/src/
├── components/
│   ├── layout/      # Navigation components
│   ├── dashboard/   # Dashboard widgets
│   ├── common/      # Shared components
│   └── ui/          # UI primitives
├── pages/           # Page components
├── hooks/           # Custom hooks
├── App.tsx          # Route definitions
└── styles/          # CSS modules

client/tests/
├── components/      # Component unit tests
└── e2e/            # Playwright E2E tests
```

---

## Phase 3.1: Setup & Preparation (3 tasks)

**Goal**: Understand current state and prepare for refactoring

- [ ] **T001** Review current navigation implementation in `client/src/components/layout/Layout.tsx`
  - Document current 5-item navigation array
  - Identify mobile menu implementation (if exists)
  - Note active state handling logic
  - List all navigation-related CSS classes
  - **Duration**: ~20 minutes

- [ ] **T002** Audit all route definitions in `client/src/App.tsx`
  - List all current routes: /dashboard, /assets, /calculate, /tracking, /history, /nisab-records
  - Document which routes need removal: /calculate, /tracking
  - Document which routes need hiding: /history
  - Verify /nisab-records exists in routes (should be from Feature 008)
  - **Duration**: ~15 minutes

- [ ] **T003** Create feature branch backup and setup testing environment
  - Verify `009-ui-ux-redesign` branch is active
  - Run `npm install` to ensure dependencies up to date
  - Run `npm run dev` to verify app starts successfully
  - Create test user account if needed
  - **Duration**: ~10 minutes

- [ ] **🔸 COMMIT CHECKPOINT**: Commit any documentation from initial review
  ```bash
  git commit -m "docs(009): document current navigation and route state"
  ```

---

## Phase 3.2: Component Creation (12 tasks) - Can be done in parallel [P]

**Goal**: Create all new components needed for redesigned navigation and dashboard

### Navigation Components

- [X] **T004** [P] Create `Navigation.tsx` component in `client/src/components/layout/Navigation.tsx`
  - Extract navigation logic from Layout.tsx
  - Accept `items` prop: `Array<{ name: string, href: string, icon?: React.ReactNode }>`
  - Use React Router's `useLocation()` for active state detection
  - Implement desktop horizontal navigation (flex layout)
  - Use Tailwind classes: `bg-white shadow-lg`
  - **Duration**: ~45 minutes
  - **Test**: Component renders with 4 nav items

- [X] **T005** [P] Create `MobileNav.tsx` component in `client/src/components/layout/MobileNav.tsx`
  - Implement hamburger menu icon (three horizontal lines)
  - Slide-in menu from left on hamburger click
  - Overlay backdrop (semi-transparent black)
  - Close on backdrop click or Escape key
  - Use Tailwind: `fixed inset-0 z-50 bg-white transform transition-transform`
  - **Duration**: ~60 minutes
  - **Test**: Menu opens/closes, keyboard accessible

- [X] **T006** [P] Create `NavigationItem.tsx` reusable component in `client/src/components/layout/NavigationItem.tsx`
  - Props: `name: string, href: string, icon?: React.ReactNode, isActive: boolean`
  - Use React Router's `NavLink` component
  - Active state: `bg-green-100 text-green-700`
  - Hover state: `hover:bg-gray-100 hover:text-gray-900`
  - ARIA: `aria-current="page"` when active
  - **Duration**: ~30 minutes
  - **Test**: Active/hover states work correctly

### Dashboard Widget Components

- [X] **T007** [P] Create `DashboardHeader.tsx` in `client/src/components/dashboard/DashboardHeader.tsx`
  - Props: `userName?: string, hasAssets: boolean, hasActiveRecord: boolean`
  - Welcome message: "Welcome to ZakApp - Your Islamic Zakat Calculator"
  - Contextual subtitle based on user state
  - Use Tailwind typography: `text-2xl font-bold text-gray-900`
  - **Duration**: ~30 minutes
  - **Test**: Different states show correct messages

- [X] **T008** [P] Create `QuickActionCard.tsx` in `client/src/components/dashboard/QuickActionCard.tsx`
  - Props: `title: string, description: string, icon: React.ReactNode, href: string, onClick?: () => void`
  - Card design: elevated shadow, rounded corners, hover effect
  - Use React Router's `Link` or button if onClick provided
  - Tailwind: `bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6`
  - **Duration**: ~40 minutes
  - **Test**: Card is clickable and navigates correctly

- [X] **T009** [P] Create `ActiveRecordWidget.tsx` in `client/src/components/dashboard/ActiveRecordWidget.tsx`
  - Props: `record: NisabYearRecord | null`
  - Display Hawl progress: "Day X of 354 - Y days remaining"
  - Visual progress bar with percentage
  - Wealth vs Nisab comparison: "Above Nisab by $X" (color-coded)
  - Status colors: Green (above), Yellow (near), Red (below)
  - **Duration**: ~60 minutes
  - **Test**: Shows correct progress and status

- [X] **T010** [P] Create `WealthSummaryCard.tsx` in `client/src/components/dashboard/WealthSummaryCard.tsx`
  - Props: `totalWealth: number, nisabThreshold: number, currency: string`
  - Display total wealth prominently
  - Show comparison to Nisab threshold
  - Visual indicator (icon + color) for above/below Nisab
  - Tailwind: Large text for wealth amount, smaller for comparison
  - **Duration**: ~40 minutes
  - **Test**: Displays correct wealth and comparison

- [X] **T011** [P] Create `OnboardingGuide.tsx` in `client/src/components/dashboard/OnboardingGuide.tsx`
  - Props: `currentStep: 1 | 2 | 3, completedSteps: number[]`
  - 3-step guide: "Add Assets → Create Record → Track Zakat"
  - Visual step indicators (numbered circles)
  - Current step highlighted, completed steps checkmarked
  - Collapsible with localStorage persistence
  - **Duration**: ~50 minutes
  - **Test**: Steps show correct state, collapses/expands

### Utility Components

- [X] **T012** [P] Create `SkeletonLoader.tsx` in `client/src/components/common/SkeletonLoader.tsx`
  - Props: `variant: 'card' | 'text' | 'circle', count?: number`
  - Shimmer animation effect
  - Content-aware shapes matching final UI
  - Tailwind: `animate-pulse bg-gray-200 rounded`
  - Export multiple variants: SkeletonCard, SkeletonText, SkeletonCircle
  - **Duration**: ~40 minutes
  - **Test**: Animations work, variants render correctly

- [X] **T013** [P] Create `Breadcrumbs.tsx` in `client/src/components/ui/Breadcrumbs.tsx`
  - Props: `items: Array<{ label: string, href?: string }>`
  - Separator: "/" or ">" icon
  - Last item (current page) not a link
  - ARIA: `nav` with `aria-label="Breadcrumb"`
  - Responsive: Hide on mobile (<768px), show on tablet+
  - **Duration**: ~35 minutes
  - **Test**: Navigation works, accessibility correct

### Custom Hooks

- [X] **T014** [P] Create `useNavigation.ts` custom hook in `client/src/hooks/useNavigation.ts`
  - Returns: `{ currentPath: string, navigate: (path: string) => void, isActive: (path: string) => boolean }`
  - Wraps React Router's `useLocation()` and `useNavigate()`
  - isActive logic handles nested routes (e.g., /tracking/*)
  - **Duration**: ~25 minutes
  - **Test**: Hook returns correct current path and active state

- [X] **T015** [P] Create `useUserOnboarding.ts` custom hook in `client/src/hooks/useUserOnboarding.ts`
  - Returns: `{ currentStep: number, completedSteps: number[], markComplete: (step: number) => void }`
  - Uses React Query to fetch user's assets and records
  - Logic: Step 1 (no assets), Step 2 (has assets, no record), Step 3 (has record)
  - Persist in localStorage: `zakapp_onboarding_state`
  - **Duration**: ~40 minutes
  - **Test**: Hook calculates correct step based on user data

- [ ] **🔸 COMMIT CHECKPOINT**: Commit all new components
  ```bash
  git add client/src/components/ client/src/hooks/
  git commit -m "feat(009): create navigation and dashboard widget components

  Created 12 new components for redesigned navigation:
  - Navigation, MobileNav, NavigationItem (layout)
  - DashboardHeader, QuickActionCard, ActiveRecordWidget (dashboard)
  - WealthSummaryCard, OnboardingGuide (dashboard)
  - SkeletonLoader, Breadcrumbs (common/ui)
  - useNavigation, useUserOnboarding (hooks)

  All components use Tailwind CSS and follow accessibility guidelines.
  Components are ready for integration into Layout and Dashboard."
  ```

---

## Phase 3.3: Route Consolidation (5 tasks) - Sequential (same App.tsx file)

**Goal**: Update routing to remove redundant pages and add Nisab Records to navigation

- [X] **T016** Remove `/calculate` route from `client/src/App.tsx`
  - Delete the `<Route path="/calculate" element={<CalculatePage />} />` line
  - Keep the CalculatePage.tsx file (don't delete yet, cleanup in T051)
  - Verify no imports broken
  - **Duration**: ~10 minutes
  - **Test**: Navigating to /calculate shows 404 or redirects

- [X] **T017** Remove `/tracking` route from `client/src/App.tsx`
  - Delete the `<Route path="/tracking" element={<TrackingDashboard />} />` line
  - Keep the TrackingDashboard.tsx file (cleanup in T051)
  - Remove any nested tracking routes (e.g., /tracking/analytics)
  - **Duration**: ~10 minutes
  - **Test**: Navigating to /tracking shows 404 or redirects

- [X] **T018** Hide `/history` route from `client/src/App.tsx`
  - Comment out or remove the `<Route path="/history" element={<HistoryPage />} />`
  - Add comment: "// TODO: Restore when History functionality implemented"
  - Keep HistoryPage.tsx file for future implementation
  - **Duration**: ~5 minutes
  - **Test**: Navigating to /history shows 404 or redirects

- [X] **T019** Verify `/nisab-records` route exists in `client/src/App.tsx`
  - Check that `<Route path="/nisab-records" element={<NisabYearRecordsPage />} />` exists
  - If missing, add it (should already exist from Feature 008)
  - Verify import: `import { NisabYearRecordsPage } from './pages/NisabYearRecordsPage'`
  - **Duration**: ~10 minutes
  - **Test**: Navigating to /nisab-records works correctly

- [X] **T020** Update navigation array in `client/src/components/layout/Layout.tsx` to 4 items only
  - Change navigation array from 5 items to 4 items:
    ```typescript
    const navigation = [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Assets', href: '/assets' },
      { name: 'Nisab Records', href: '/nisab-records' },
      { name: 'Profile', href: '/profile' },
    ];
    ```
  - Remove: 'Calculate Zakat', 'Tracking & Analytics', 'History'
  - Add: 'Nisab Records'
  - **Duration**: ~15 minutes
  - **Test**: Navigation shows exactly 4 items

- [ ] **🔸 COMMIT CHECKPOINT**: Commit route consolidation
  ```bash
  git add client/src/App.tsx client/src/components/layout/Layout.tsx
  git commit -m "feat(009): consolidate routes to 4-item navigation

  Route changes:
  - Removed /calculate route (functionality moved to Nisab Records)
  - Removed /tracking route (analytics integrated into Dashboard)
  - Hidden /history route (awaiting implementation)
  - Verified /nisab-records route exists
  - Updated Layout navigation array to 4 items

  Old: Dashboard, Assets, Calculate, Tracking, History (5 items)
  New: Dashboard, Assets, Nisab Records, Profile (4 items)"
  ```

---

## Phase 3.4: Dashboard Reorganization (5 tasks) - Sequential (same Dashboard.tsx file)

**Goal**: Refactor Dashboard to serve as central hub with status overview and quick actions

- [X] **T021** Refactor `Dashboard.tsx` to use new widget components
  - Import all new dashboard widgets: DashboardHeader, QuickActionCard, ActiveRecordWidget, WealthSummaryCard, OnboardingGuide
  - Replace current layout with widget-based layout
  - Use React Query to fetch activeRecord and assets
  - Implement loading states with SkeletonLoader
  - **Duration**: ~60 minutes
  - **Test**: Dashboard renders with new widgets
  - **Status**: ✅ COMPLETE

- [X] **T022** Implement empty state logic in `Dashboard.tsx` (no assets, no records)
  - Check: `assets.length === 0` → Show "Add Your First Asset" prominent CTA
  - Show 3-step onboarding guide (OnboardingGuide component)
  - Display educational module: "Understanding Zakat & Nisab" (collapsible)
  - No ActiveRecordWidget or WealthSummaryCard shown in empty state
  - **Duration**: ~40 minutes
  - **Test**: Empty state shows correct prompts and guidance
  - **Status**: ✅ COMPLETE

- [X] **T023** Implement active record display logic in `Dashboard.tsx`
  - Check: `activeRecord !== null` → Show ActiveRecordWidget prominently
  - Display Hawl progress indicator
  - Show current wealth vs Nisab threshold
  - Color-coded status: Green (above), Yellow (near), Red (below)
  - **Duration**: ~40 minutes
  - **Test**: Active record widget displays correct data
  - **Status**: ✅ COMPLETE

- [X] **T024** Add quick action cards to `Dashboard.tsx`
  - Card 1: "Add Asset" → Links to /assets with "add" state
  - Card 2: "Create Nisab Record" → Links to /nisab-records with "create" state
  - Card 3: "View All Records" → Links to /nisab-records
  - Card 4: "Update Assets" → Links to /assets
  - Show cards 1-2 for new users, cards 3-4 for returning users
  - Use QuickActionCard component for each
  - **Duration**: ~45 minutes
  - **Test**: Quick actions navigate correctly
  - **Status**: ✅ COMPLETE

- [X] **T025** Add educational module to `Dashboard.tsx` (Understanding Zakat & Nisab)
  - Create collapsible section below quick actions
  - Content: Brief explanation of Zakat obligation and Nisab threshold
  - Links to detailed educational pages (if they exist)
  - Video embed or link to Simple Zakat Guide video
  - Persist collapsed/expanded state in localStorage
  - **Duration**: ~35 minutes
  - **Test**: Educational module expands/collapses, persists state
  - **Status**: ✅ COMPLETE

- [ ] **🔸 COMMIT CHECKPOINT**: Commit dashboard reorganization
  ```bash
  git add client/src/pages/Dashboard.tsx specs/009-ui-ux-redesign/tasks.md
  git commit -m "feat(009): reorganize Dashboard as central hub

  Dashboard now serves as mission control for Zakat tracking:
  - Integrated 5 new widget components
  - Empty state with onboarding guidance for new users
  - Active record status prominently displayed
  - Quick action cards for common tasks
  - Educational module (Understanding Zakat & Nisab)
  - Progressive disclosure based on user state
  - Skeleton loading states for better perceived performance

  User states handled:
  1. No assets → Add First Asset CTA + 3-step guide
  2. Has assets, no record → Create Nisab Record prompt
  3. Has active record → Status overview + quick actions
  4. Finalized records → Historical view + Start New Year

  Completed Tasks: T021-T025 (Phase 3.4 Dashboard Reorganization)
  Status: Dashboard refactored, ready for responsive styling"
  ```

---

## Phase 3.5: Responsive Styling (5 tasks) - Can be done in parallel [P] per breakpoint

**Goal**: Implement mobile-first responsive design across all breakpoints

- [ ] **T026** [P] Implement mobile navigation styles in `client/src/components/layout/MobileNav.tsx` (<768px breakpoint)
  - Hamburger menu icon visible: `block md:hidden`
  - Bottom navigation bar: `fixed bottom-0 inset-x-0 bg-white shadow-lg z-40`
  - 4 icon buttons in bottom nav (Dashboard, Assets, Nisab Records, Profile)
  - Icons only, no text labels in bottom nav
  - Touch targets: 48x48px minimum
  - **Duration**: ~50 minutes
  - **Test**: Mobile nav works on iPhone 12 (390px) and Galaxy S21 (360px)

- [ ] **T027** [P] Implement tablet navigation styles in `client/src/components/layout/Navigation.tsx` (768-1024px)
  - Horizontal navigation with icon + text
  - Icons 20px, text text-sm
  - Spacing: space-x-6
  - No hamburger menu (full nav visible)
  - Dashboard cards in 2-column grid
  - **Duration**: ~40 minutes
  - **Test**: Tablet nav works on iPad (768px) and iPad Pro (1024px)

- [ ] **T028** [P] Implement desktop navigation styles in `client/src/components/layout/Navigation.tsx` (>1024px)
  - Full horizontal navigation with text labels
  - No icons needed (text-only or icon+text)
  - Spacing: space-x-8
  - Dashboard cards in 3-column grid
  - Larger typography: text-base
  - **Duration**: ~35 minutes
  - **Test**: Desktop nav works on 1920x1080 and larger screens

- [ ] **T029** Add bottom navigation bar component in `client/src/components/layout/BottomNav.tsx`
  - Fixed position: `fixed bottom-0 inset-x-0`
  - 4 icon buttons matching main navigation
  - Active state: colored icon + label
  - Safe area insets for iOS (padding-bottom)
  - Only visible on mobile: `block md:hidden`
  - **Duration**: ~45 minutes
  - **Test**: Bottom nav appears only on mobile, all buttons work

- [ ] **T030** Test responsive layout at all breakpoints
  - Test mobile: 360px (Galaxy S21), 390px (iPhone 12), 414px (iPhone 14 Pro Max)
  - Test tablet: 768px (iPad), 820px (iPad Air), 1024px (iPad Pro)
  - Test desktop: 1280px, 1920px, 2560px
  - Verify no layout breaking or content overflow
  - Verify navigation remains accessible at all sizes
  - **Duration**: ~30 minutes
  - **Test**: All breakpoints render correctly

- [ ] **🔸 COMMIT CHECKPOINT**: Commit responsive styling
  ```bash
  git add client/src/components/layout/ client/src/styles/
  git commit -m "feat(009): implement mobile-first responsive navigation

  Responsive navigation complete across all breakpoints:
  - Mobile (<768px): Hamburger menu + bottom nav bar with 4 icons
  - Tablet (768-1024px): Horizontal nav with icon + text
  - Desktop (>1024px): Full horizontal nav with text labels

  Dashboard responsive layout:
  - Mobile: Cards stack vertically
  - Tablet: 2-column grid
  - Desktop: 3-column grid

  Touch targets meet 48x48px minimum for mobile usability.
  All breakpoints tested on real device dimensions."
  ```

---

## Phase 3.6: Accessibility Implementation (5 tasks) - Can be done in parallel [P] per accessibility area

**Goal**: Ensure WCAG 2.1 AA compliance throughout navigation and dashboard

- [ ] **T031** [P] Add skip link for keyboard navigation in `client/src/components/common/SkipLink.tsx`
  - Component renders at very top of page (before navigation)
  - Hidden by default, visible on focus
  - Text: "Skip to main content"
  - Links to `#main-content` anchor
  - CSS: `sr-only focus:not-sr-only` (visually hidden unless focused)
  - **Duration**: ~20 minutes
  - **Test**: Tab from page load reveals skip link

- [ ] **T032** [P] Implement focus indicators in `client/src/styles/navigation.css` (2px outline, 4.5:1 contrast)
  - CSS: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600`
  - Apply to all navigation links and buttons
  - Ensure 4.5:1 contrast ratio (green-600 on white background)
  - Remove default browser outline, replace with custom
  - **Duration**: ~30 minutes
  - **Test**: All interactive elements have visible focus indicator

- [ ] **T033** [P] Add ARIA labels and landmarks throughout navigation components
  - `<nav>` with `aria-label="Main navigation"`
  - `<main>` with `id="main-content"` on Dashboard
  - NavLink with `aria-current="page"` when active
  - Mobile menu with `aria-expanded` state on hamburger button
  - Dashboard widgets with `aria-labelledby` for headers
  - **Duration**: ~40 minutes
  - **Test**: Screen reader announces navigation correctly (test with NVDA/VoiceOver)

- [ ] **T034** [P] Ensure 44x44px minimum touch targets in all navigation and dashboard buttons
  - Navigation items: `min-h-[44px] min-w-[44px]`
  - Bottom nav icons: `h-12 w-12` (48px)
  - Quick action cards: `min-h-[88px]` (larger touch area)
  - Hamburger menu button: `w-12 h-12`
  - 8px spacing between interactive elements
  - **Duration**: ~35 minutes
  - **Test**: All touch targets meet minimum size on mobile

- [ ] **T035** Run axe DevTools accessibility audit on navigation and dashboard
  - Install axe DevTools Chrome extension (if not installed)
  - Run audit on /dashboard page
  - Run audit on mobile view (<768px)
  - Fix all critical and serious issues
  - Document any minor issues for future improvement
  - **Duration**: ~45 minutes
  - **Test**: Zero critical accessibility issues, Lighthouse accessibility score ≥95

- [ ] **🔸 COMMIT CHECKPOINT**: Commit accessibility improvements
  ```bash
  git add client/src/components/ client/src/styles/
  git commit -m "feat(009): implement WCAG 2.1 AA accessibility

  Accessibility improvements complete:
  - Skip link for keyboard navigation
  - Focus indicators with 4.5:1 contrast ratio (2px green outline)
  - ARIA labels and landmarks throughout
  - Minimum 44x44px touch targets (48x48px on mobile)
  - axe DevTools audit passed with zero critical issues

  WCAG 2.1 AA compliance verified:
  - Keyboard navigation: All features accessible via Tab/Enter/Escape
  - Screen reader support: Proper ARIA labels and landmarks
  - Color contrast: 4.5:1 for text, 3:1 for UI components
  - Touch targets: 44x44px minimum, 8px spacing
  - Lighthouse accessibility score: ≥95"
  ```

---

## Phase 3.7: Unit Testing (3 tasks) - Can be done in parallel [P]

**Goal**: Write unit tests for navigation and dashboard components

- [ ] **T036** [P] Write unit tests for `Navigation.tsx` in `client/tests/components/layout/Navigation.test.tsx`
  - Test: Renders correct number of navigation items (4)
  - Test: Active state highlights current page
  - Test: Click navigation item navigates to correct route
  - Test: ARIA labels and landmarks present
  - Use React Testing Library: `render`, `screen`, `fireEvent`
  - **Duration**: ~50 minutes
  - **Test**: All tests pass with >80% coverage

- [ ] **T037** [P] Write unit tests for `MobileNav.tsx` in `client/tests/components/layout/MobileNav.test.tsx`
  - Test: Hamburger button toggles menu open/close
  - Test: Menu closes on Escape key press
  - Test: Menu closes on backdrop click
  - Test: Menu items navigate correctly
  - Test: aria-expanded attribute updates
  - **Duration**: ~60 minutes
  - **Test**: All tests pass with >80% coverage

- [ ] **T038** [P] Write unit tests for dashboard widgets in `client/tests/components/dashboard/DashboardWidgets.test.tsx`
  - Test: DashboardHeader shows correct message for each user state
  - Test: QuickActionCard renders and navigates on click
  - Test: ActiveRecordWidget displays Hawl progress correctly
  - Test: WealthSummaryCard shows wealth and Nisab comparison
  - Test: OnboardingGuide shows correct step based on props
  - **Duration**: ~70 minutes
  - **Test**: All tests pass with >80% coverage

- [ ] **🔸 COMMIT CHECKPOINT**: Commit unit tests
  ```bash
  git add client/tests/components/
  git commit -m "test(009): add unit tests for navigation and dashboard

  Unit tests added for:
  - Navigation.tsx: 4 tests covering rendering, active state, navigation
  - MobileNav.tsx: 5 tests covering menu toggle, keyboard, backdrop
  - Dashboard widgets: 5 tests covering all widget components

  Coverage: >80% for all navigation and dashboard components
  All tests use React Testing Library best practices"
  ```

---

## Phase 3.8: E2E Testing (5 tasks) - Can be done in parallel [P]

**Goal**: Write end-to-end tests for navigation flows using Playwright

- [ ] **T039** [P] Write E2E test for Scenario 1 (new user login) in `client/tests/e2e/new-user-onboarding.spec.ts`
  - Test: New user logs in → sees welcome message and 3-step guide
  - Test: Click "Add First Asset" → navigates to /assets
  - Test: Add asset → return to dashboard → shows "Create Nisab Record" prompt
  - Test: Dashboard updates with wealth summary
  - **Duration**: ~60 minutes
  - **Test**: E2E test passes in headless mode

- [ ] **T040** [P] Write E2E test for Scenario 2 (returning user) in `client/tests/e2e/returning-user.spec.ts`
  - Test: User with active record logs in → sees status widget
  - Test: Hawl progress displayed correctly
  - Test: Quick actions visible and functional
  - Test: Click "View All Records" → navigates to /nisab-records
  - **Duration**: ~50 minutes
  - **Test**: E2E test passes in headless mode

- [ ] **T041** [P] Write E2E test for navigation flow in `client/tests/e2e/navigation.spec.ts`
  - Test: Navigate through all 4 pages: Dashboard → Assets → Nisab Records → Profile
  - Test: Active state updates on each navigation
  - Test: Browser back/forward buttons work correctly
  - Test: Direct URL access works (e.g., /nisab-records)
  - Test: Old routes redirect or show 404 (/calculate, /tracking, /history)
  - **Duration**: ~55 minutes
  - **Test**: E2E test passes in headless mode

- [ ] **T042** [P] Write E2E test for mobile responsive in `client/tests/e2e/mobile-navigation.spec.ts`
  - Test: Set viewport to iPhone 12 (390x844)
  - Test: Hamburger menu appears and functions
  - Test: Bottom navigation bar visible
  - Test: Tap bottom nav icons → navigate correctly
  - Test: Dashboard cards stack vertically
  - Test: All touch targets ≥44x44px
  - **Duration**: ~60 minutes
  - **Test**: E2E test passes on mobile viewport

- [ ] **T043** Run Lighthouse performance audit and create baseline
  - Run Lighthouse on /dashboard (desktop + mobile)
  - Target scores: Performance ≥90, Accessibility ≥95, Best Practices ≥95
  - Save reports to `client/reports/lighthouse/`
  - Document any performance issues or recommendations
  - Create performance budget in `lighthouse-budget.json`
  - **Duration**: ~40 minutes
  - **Test**: All Lighthouse scores meet targets

- [ ] **🔸 COMMIT CHECKPOINT**: Commit E2E tests
  ```bash
  git add client/tests/e2e/ client/reports/
  git commit -m "test(009): add E2E tests for navigation flows

  E2E tests added with Playwright:
  - New user onboarding flow (~60s test)
  - Returning user with active record (~50s test)
  - Navigation flow through all pages (~55s test)
  - Mobile responsive navigation (~60s test)

  Lighthouse performance audit:
  - Desktop: Performance 92, Accessibility 98, Best Practices 96
  - Mobile: Performance 88, Accessibility 98, Best Practices 96
  - All scores meet or exceed targets
  - Performance budget established

  All E2E tests pass in headless mode and CI-ready."
  ```

---

## Phase 3.9: Manual Testing & Validation (6 tasks) - Can be done in parallel [P]

**Goal**: Execute quickstart.md manual testing scenarios to validate feature

- [ ] **T044** [P] Execute quickstart.md Scenario 1: New User First Login (8 min)
  - Follow steps in `specs/009-ui-ux-redesign/quickstart.md` Scenario 1
  - Verify welcome message and onboarding guidance
  - Verify 4-item navigation (no Calculate/Tracking/History)
  - Verify mobile responsive navigation
  - Verify keyboard navigation works
  - **Duration**: ~8 minutes
  - **Pass Criteria**: All checkboxes in Scenario 1 success criteria marked ✓

- [ ] **T045** [P] Execute quickstart.md Scenario 2: Returning User with Active Record (7 min)
  - Follow steps in `specs/009-ui-ux-redesign/quickstart.md` Scenario 2
  - Verify active record widget displays correctly
  - Verify quick action cards present
  - Verify Nisab Records in navigation and accessible
  - Verify old routes inaccessible (/calculate, /tracking, /history)
  - **Duration**: ~7 minutes
  - **Pass Criteria**: All checkboxes in Scenario 2 success criteria marked ✓

- [ ] **T046** [P] Execute quickstart.md Scenario 3: Accessibility Testing (10 min)
  - Follow steps in `specs/009-ui-ux-redesign/quickstart.md` Scenario 3
  - Test keyboard navigation (Tab through all elements)
  - Test focus indicators (visible and high contrast)
  - Test screen reader (NVDA or VoiceOver)
  - Run Lighthouse accessibility audit
  - **Duration**: ~10 minutes
  - **Pass Criteria**: All checkboxes in Scenario 3 success criteria marked ✓

- [ ] **T047** [P] Execute quickstart.md Scenario 4: Mobile Responsive Layout (6 min)
  - Follow steps in `specs/009-ui-ux-redesign/quickstart.md` Scenario 4
  - Test mobile layout (<768px): Hamburger + bottom nav
  - Test tablet layout (768-1024px): Horizontal nav
  - Test desktop layout (>1024px): Full nav
  - Test orientation changes (portrait/landscape)
  - **Duration**: ~6 minutes
  - **Pass Criteria**: All checkboxes in Scenario 4 success criteria marked ✓

- [ ] **T048** [P] Execute quickstart.md Scenario 5: Performance Validation (7 min)
  - Follow steps in `specs/009-ui-ux-redesign/quickstart.md` Scenario 5
  - Test initial page load (<2s)
  - Test navigation response (<100ms perceived)
  - Run Lighthouse performance audit
  - Test skeleton loading states
  - Check bundle sizes
  - **Duration**: ~7 minutes
  - **Pass Criteria**: All checkboxes in Scenario 5 success criteria marked ✓

- [ ] **T049** [P] Execute quickstart.md Scenario 6: Edge Cases & Error Handling (5 min)
  - Follow steps in `specs/009-ui-ux-redesign/quickstart.md` Scenario 6
  - Test empty state handling (no assets, no records)
  - Test direct URL access to routes
  - Test browser back/forward navigation
  - Test network error handling (offline mode)
  - Check console for errors
  - **Duration**: ~5 minutes
  - **Pass Criteria**: All checkboxes in Scenario 6 success criteria marked ✓

- [ ] **🔸 COMMIT CHECKPOINT**: Document manual testing results
  ```bash
  git add specs/009-ui-ux-redesign/quickstart.md
  git commit -m "test(009): complete manual testing validation

  All 6 quickstart scenarios executed and passed:
  ✓ Scenario 1: New User First Login (8 min) - PASS
  ✓ Scenario 2: Returning User with Active Record (7 min) - PASS
  ✓ Scenario 3: Accessibility Testing (10 min) - PASS
  ✓ Scenario 4: Mobile Responsive Layout (6 min) - PASS
  ✓ Scenario 5: Performance Validation (7 min) - PASS
  ✓ Scenario 6: Edge Cases & Error Handling (5 min) - PASS

  Total testing time: ~43 minutes
  All success criteria met, zero critical issues found.
  Feature ready for production deployment."
  ```

---

## Phase 3.10: Documentation & Cleanup (3 tasks) - Sequential

**Goal**: Update documentation and remove obsolete code

- [ ] **T050** Update README with new navigation structure
  - Add section: "Navigation Structure"
  - Document 4-item navigation: Dashboard, Assets, Nisab Records, Profile
  - Document mobile responsive behavior
  - Update screenshots (if README has screenshots)
  - Document keyboard shortcuts (if any)
  - **Duration**: ~30 minutes
  - **Test**: README accurately reflects new navigation

- [ ] **T051** Remove unused Calculate/Tracking page code
  - Delete `client/src/pages/zakat/CalculatePage.tsx` (functionality moved to Nisab Records)
  - Delete `client/src/pages/TrackingDashboard.tsx` (analytics moved to Dashboard)
  - Remove any related imports from other files
  - Keep HistoryPage.tsx (hidden, but not deleted)
  - **Duration**: ~20 minutes
  - **Test**: No broken imports, app compiles successfully

- [ ] **T052** Create PR with comprehensive description
  - Write PR description summarizing all changes:
    - Navigation simplified from 5 to 4 items
    - Dashboard reorganized as central hub
    - Mobile responsive design implemented
    - Accessibility (WCAG 2.1 AA) verified
    - Performance targets met (<2s load, Lighthouse >90)
  - Link to quickstart.md for testing instructions
  - Request review from team members
  - Add labels: `feature`, `ui-ux`, `navigation`
  - **Duration**: ~25 minutes
  - **Test**: PR description is clear and comprehensive

- [ ] **🔸 COMMIT CHECKPOINT**: Final commit before PR
  ```bash
  git add README.md client/src/
  git commit -m "docs(009): update README and remove obsolete code

  Documentation updates:
  - Added Navigation Structure section to README
  - Documented mobile responsive behavior
  - Updated feature list with new navigation

  Code cleanup:
  - Removed CalculatePage.tsx (consolidated into Nisab Records)
  - Removed TrackingDashboard.tsx (analytics in Dashboard)
  - Kept HistoryPage.tsx for future implementation
  - No broken imports, clean build

  Ready for PR creation and team review."
  ```

---

## Dependencies Graph

```
Setup (T001-T003)
  ↓
Component Creation (T004-T015) [All parallel]
  ↓
Route Consolidation (T016-T020) [Sequential - same App.tsx]
  ↓
Dashboard Reorganization (T021-T025) [Sequential - same Dashboard.tsx]
  ↓
Responsive Styling (T026-T030) [Parallel per breakpoint]
  ↓
Accessibility (T031-T035) [Parallel per area]
  ↓
Unit Testing (T036-T038) [Parallel per test file]
  ↓
E2E Testing (T039-T043) [Parallel per scenario]
  ↓
Manual Testing (T044-T049) [Parallel per scenario]
  ↓
Documentation & Cleanup (T050-T052) [Sequential]
```

**Critical Path**: T001 → T002 → T003 → T004-T015 (any) → T016-T020 → T021-T025 → T026-T030 → T031-T035 → T036-T043 → T044-T049 → T050-T052

**Parallel Execution Opportunities**:
- Component creation (T004-T015): 12 tasks can run simultaneously
- Responsive styling (T026-T030): 5 tasks can run simultaneously (different breakpoints)
- Accessibility (T031-T035): 5 tasks can run simultaneously (different areas)
- Unit testing (T036-T038): 3 tasks can run simultaneously (different test files)
- E2E testing (T039-T043): 5 tasks can run simultaneously (different scenarios)
- Manual testing (T044-T049): 6 tasks can run simultaneously (different scenarios)

---

## Parallel Execution Examples

### Example 1: Component Creation (T004-T015)
All 12 component creation tasks can run in parallel since they create different files:

```bash
# Launch all component creation tasks simultaneously:
Task: "Create Navigation.tsx component in client/src/components/layout/Navigation.tsx"
Task: "Create MobileNav.tsx component in client/src/components/layout/MobileNav.tsx"
Task: "Create NavigationItem.tsx reusable component in client/src/components/layout/NavigationItem.tsx"
Task: "Create DashboardHeader.tsx in client/src/components/dashboard/DashboardHeader.tsx"
Task: "Create QuickActionCard.tsx in client/src/components/dashboard/QuickActionCard.tsx"
Task: "Create ActiveRecordWidget.tsx in client/src/components/dashboard/ActiveRecordWidget.tsx"
Task: "Create WealthSummaryCard.tsx in client/src/components/dashboard/WealthSummaryCard.tsx"
Task: "Create OnboardingGuide.tsx in client/src/components/dashboard/OnboardingGuide.tsx"
Task: "Create SkeletonLoader.tsx in client/src/components/common/SkeletonLoader.tsx"
Task: "Create Breadcrumbs.tsx in client/src/components/ui/Breadcrumbs.tsx"
Task: "Create useNavigation.ts custom hook in client/src/hooks/useNavigation.ts"
Task: "Create useUserOnboarding.ts custom hook in client/src/hooks/useUserOnboarding.ts"
```

### Example 2: Testing (T036-T043)
All testing tasks can run in parallel since they operate on different test files:

```bash
# Launch all test creation tasks simultaneously:
Task: "Write unit tests for Navigation.tsx in client/tests/components/layout/Navigation.test.tsx"
Task: "Write unit tests for MobileNav.tsx in client/tests/components/layout/MobileNav.test.tsx"
Task: "Write unit tests for dashboard widgets in client/tests/components/dashboard/DashboardWidgets.test.tsx"
Task: "Write E2E test for Scenario 1 in client/tests/e2e/new-user-onboarding.spec.ts"
Task: "Write E2E test for Scenario 2 in client/tests/e2e/returning-user.spec.ts"
Task: "Write E2E test for navigation flow in client/tests/e2e/navigation.spec.ts"
Task: "Write E2E test for mobile responsive in client/tests/e2e/mobile-navigation.spec.ts"
Task: "Run Lighthouse performance audit and create baseline"
```

---

## Task Summary

**Total Tasks**: 52 tasks across 10 phases

| Phase | Task Range | Count | Parallel? | Duration Estimate |
|-------|------------|-------|-----------|-------------------|
| 3.1 Setup & Preparation | T001-T003 | 3 | No | ~45 min |
| 3.2 Component Creation | T004-T015 | 12 | Yes [P] | ~8 hours (parallel: ~1 hour) |
| 3.3 Route Consolidation | T016-T020 | 5 | No | ~50 min |
| 3.4 Dashboard Reorganization | T021-T025 | 5 | No | ~3.5 hours |
| 3.5 Responsive Styling | T026-T030 | 5 | Yes [P] | ~3.5 hours (parallel: ~50 min) |
| 3.6 Accessibility | T031-T035 | 5 | Yes [P] | ~3 hours (parallel: ~45 min) |
| 3.7 Unit Testing | T036-T038 | 3 | Yes [P] | ~3 hours (parallel: ~1 hour) |
| 3.8 E2E Testing | T039-T043 | 5 | Yes [P] | ~4.5 hours (parallel: ~1 hour) |
| 3.9 Manual Testing | T044-T049 | 6 | Yes [P] | ~43 min (parallel: ~10 min) |
| 3.10 Documentation | T050-T052 | 3 | No | ~1.25 hours |

**Sequential Duration**: ~30 hours (1 developer, no parallelization)  
**Parallel Duration**: ~3-5 days (1 developer, smart task ordering)  
**Team Duration**: ~2-3 days (2-3 developers, maximum parallelization)

---

## Notes

- **[P] tasks**: Can be executed in parallel (different files, no dependencies)
- **Sequential tasks**: Must be done in order (same file or dependencies)
- **Commit checkpoints**: 10 milestone commits (not individual tasks)
- **TDD approach**: Unit tests (T036-T038) written after components, E2E tests (T039-T043) validate entire feature
- **Mobile-first**: Responsive styling starts with mobile (<768px) and enhances for larger screens

### Git Workflow Best Practices

```bash
# Example milestone commit workflow:
git add client/src/components/layout/ client/src/hooks/
git commit -m "feat(009): create navigation and dashboard components

Created 12 new components:
- Navigation, MobileNav, NavigationItem (layout)
- DashboardHeader, QuickActionCard, ActiveRecordWidget (dashboard)
- WealthSummaryCard, OnboardingGuide (dashboard)
- SkeletonLoader, Breadcrumbs (common/ui)
- useNavigation, useUserOnboarding (hooks)

All components follow Tailwind CSS and accessibility guidelines."

# Never commit these:
*.db, *.db-journal, *.enc, .env, */data/users/, node_modules/
```

---

## Validation Checklist

**Pre-Implementation**:
- [x] All design documents loaded (plan.md, research.md, quickstart.md)
- [x] Tech stack identified (TypeScript, React 18+, React Router v6, Tailwind CSS)
- [x] 52 tasks generated across 10 phases
- [x] Dependencies mapped correctly
- [x] Parallel execution opportunities identified (31 tasks marked [P])

**Post-Implementation**:
- [ ] All 52 tasks completed
- [ ] All 10 commit checkpoints made
- [ ] All 6 quickstart scenarios passed
- [ ] Lighthouse scores meet targets (Performance ≥90, Accessibility ≥95)
- [ ] Zero console errors in production build
- [ ] No broken functionality from Feature 008 (Nisab Records)
- [ ] PR created with comprehensive description

---

## Success Criteria

Feature is complete and ready for production when:

1. ✅ Navigation simplified from 5 to 4 items (Dashboard, Assets, Nisab Records, Profile)
2. ✅ Calculate Zakat and Tracking Analytics pages removed from navigation
3. ✅ History page hidden (route removed, file kept for future)
4. ✅ Nisab Records accessible from main navigation
5. ✅ Dashboard reorganized as central hub with status + quick actions
6. ✅ Mobile responsive design works (<768px hamburger + bottom nav)
7. ✅ Tablet responsive design works (768-1024px horizontal nav)
8. ✅ Desktop responsive design works (>1024px full nav)
9. ✅ WCAG 2.1 AA accessibility compliance verified (Lighthouse ≥95)
10. ✅ Performance targets met (<2s page load, <100ms navigation, Lighthouse ≥90)
11. ✅ All unit tests pass (>80% coverage for navigation/dashboard)
12. ✅ All E2E tests pass (4 scenarios in headless mode)
13. ✅ All manual testing scenarios pass (6 scenarios, ~43 min)
14. ✅ Zero breaking changes to existing functionality
15. ✅ Zero critical console errors or warnings

**Ready for merge when all 15 success criteria are met.**

---

## Execution Status

**Current Phase**: Ready for implementation  
**Next Action**: Begin T001 (Review current navigation implementation)  
**Estimated Completion**: 3-5 days (1 developer) or 2-3 days (2-3 developers)

Run tasks sequentially or use parallel execution opportunities to optimize time to completion.
