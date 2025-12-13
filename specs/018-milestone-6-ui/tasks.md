# Tasks: Milestone 6 - UI/UX Enhancements

**Input**: Design documents from `/specs/018-milestone-6-ui/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included as verification steps for each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel
- **[Story]**: US1 (A11y), US2 (Perf), US3 (PWA), US4 (Usability)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install necessary dependencies for all user stories.

- [x] T001 [P] Install dependencies: `vite-plugin-pwa`, `react-hot-toast`, `@axe-core/react`, `web-vitals` in `client/package.json`

---

## Phase 2: User Story 1 - Accessibility Compliance (Priority: P1)

**Goal**: Ensure the application is usable by everyone, achieving WCAG 2.1 AA compliance.

**Independent Test**: Run `npm run test:a11y` (if script added) or use Axe DevTools extension.

### Implementation for User Story 1

- [x] T002 [P] [US1] Configure `@axe-core/react` in `client/src/main.tsx` to run only in development mode
- [x] T003 [P] [US1] Create "Skip to Content" link component in `client/src/components/ui/SkipLink.tsx` and add to `client/src/App.tsx`
- [x] T004 [US1] Audit and replace non-semantic `div` elements with `main`, `section`, `article`, `header`, `footer` in `client/src/components/layout/`
- [x] T005 [US1] Ensure all form inputs in `client/src/components/` have associated `<label>` elements or `aria-label` attributes
- [x] T006 [US1] Implement focus trapping for Modals in `client/src/components/ui/Modal.tsx` (or equivalent)

**Checkpoint**: App should pass Axe DevTools audit with 0 critical/serious issues.

---

## Phase 3: User Story 2 - Performance Optimization (Priority: P1)

**Goal**: Achieve < 2s LCP and smooth interactions.

**Independent Test**: Lighthouse Performance audit > 90.

### Implementation for User Story 2

- [x] T007 [P] [US2] Implement route-level code splitting using `React.lazy` and `Suspense` in `client/src/App.tsx` (or router config)
- [x] T008 [P] [US2] Optimize images in `client/src/assets/` (convert to WebP) and implement lazy loading for `<img>` tags
- [x] T009 [US2] Analyze bundle size using `rollup-plugin-visualizer` and configure manual chunks in `client/vite.config.ts` if main chunk > 500kb

**Checkpoint**: Lighthouse Performance score should be > 90 on Mobile.

---

## Phase 4: User Story 3 - PWA Capabilities (Priority: P2)

**Goal**: Make the app installable and offline-capable.

**Independent Test**: "Install App" prompt appears; Offline page shows when network disconnected.

### Implementation for User Story 3

- [x] T010 [P] [US3] Generate PWA icons (192x192, 512x512, maskable variants) in `client/public/icons/`
- [x] T011 [P] [US3] Create `client/public/offline.html` with a user-friendly "You are offline" message
- [x] T012 [US3] Configure `VitePWA` plugin in `client/vite.config.ts` with manifest details (name, theme_color, icons) and workbox strategies
- [x] T013 [US3] Register Service Worker in `client/src/main.tsx` (or via plugin's auto-injection) and handle update prompts

**Checkpoint**: Application tab in DevTools shows valid Manifest and active Service Worker.

---

## Phase 5: User Story 4 - Enhanced Usability & Feedback (Priority: P2)

**Goal**: Provide clear feedback for all user actions.

**Independent Test**: Trigger success/error actions and verify Toast notifications appear.

### Implementation for User Story 4

- [x] T014 [P] [US4] Create `ToastProvider` component wrapping the app in `client/src/App.tsx` using `react-hot-toast`
- [x] T015 [P] [US4] Create `Skeleton` component in `client/src/components/ui/Skeleton.tsx` using Tailwind animate-pulse
- [x] T016 [US4] Replace `alert()` and console errors with `toast.success()` and `toast.error()` in all Service/Component error handlers
- [x] T017 [US4] Implement `Skeleton` loading states in `client/src/pages/Dashboard.tsx` and Asset Lists while data is fetching

**Checkpoint**: All async actions show loading skeletons/spinners and result in Toast notifications.

---

## Phase 6: Verification & Documentation

**Purpose**: Final quality checks and documentation updates.

- [x] T018 [US1] [US2] [US3] [US4] Run Lighthouse mobile audit and save results to `specs/018-milestone-6-ui/lighthouse-report.json`
- [x] T019 [US3] [US4] Update `README.md` with PWA installation instructions and accessibility statement

