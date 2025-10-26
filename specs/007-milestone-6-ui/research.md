# Technical Research: Milestone 6 - UI/UX Enhancements

**Feature**: Milestone 6 - UI/UX Enhancements  
**Date**: October 26, 2025  
**Research Phase**: Phase 0

## Research Areas & Decisions

### 1. WCAG 2.1 AA Compliance - React Implementation

#### Decision
Use **Radix UI primitives** + **react-aria** hooks + **automated testing with axe-core**

#### Rationale
- **Radix UI**: Unstyled, accessible components that follow ARIA best practices
  - Pre-built keyboard navigation
  - Focus management out of the box
  - Screen reader compatible
  - Works seamlessly with Tailwind CSS (our existing styling)
  
- **react-aria**: Adobe's accessibility hooks for custom components
  - Low-level primitives for building accessible interactions
  - Handles edge cases (mobile, internationalization)
  - Battle-tested in production applications
  
- **axe-core**: Industry-standard accessibility testing
  - Automated WCAG 2.1 AA validation
  - Integrates with Jest and CI/CD
  - Detailed violation reports with remediation guidance

#### Alternatives Considered
- **Chakra UI**: Too opinionated, would require major UI redesign
- **MUI (Material-UI)**: Heavy bundle size, conflicts with Tailwind
- **Headless UI**: Good, but less comprehensive than Radix UI
- **Manual ARIA implementation**: Too error-prone, lacks testing coverage

#### Implementation Pattern
```typescript
// Use Radix for complex components
import * as Dialog from '@radix-ui/react-dialog';

// Use react-aria for custom interactions
import { useFocusRing, useButton } from 'react-aria';

// Test with axe-core
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);
```

---

### 2. Performance Optimization - Core Web Vitals Strategy

#### Decision
Use **Vite's native code splitting** + **React.lazy** + **workbox** + **web-vitals library**

#### Rationale
- **Vite**: Already in use, excellent build performance
  - Automatic code splitting for dynamic imports
  - Tree-shaking and minification built-in
  - Fast HMR for development

- **React.lazy + Suspense**: Official React solution
  - Route-based code splitting
  - Component-level lazy loading
  - Built-in loading state management

- **Workbox**: Google's PWA toolkit
  - Generates optimized service worker code
  - Multiple caching strategies (NetworkFirst, CacheFirst, StaleWhileRevalidate)
  - Integrates with Vite via plugin

- **web-vitals**: Official Google library
  - Accurate Core Web Vitals measurement
  - Matches Google Search Console metrics
  - Lightweight (<1KB)

#### Performance Targets
| Metric | Target | Current Baseline | Strategy |
|--------|--------|------------------|----------|
| FCP | <1.5s | TBD | Code splitting, critical CSS |
| LCP | <2.5s | TBD | Image optimization, preloading |
| FID | <100ms | TBD | Debouncing, web workers |
| CLS | <0.1 | TBD | Fixed dimensions, font loading |
| Bundle Size | <200KB | TBD | Tree-shaking, lazy loading |

#### Alternatives Considered
- **Webpack**: Slower builds than Vite, more complex config
- **Next.js**: Would require full rewrite, too heavy
- **Parcel**: Less ecosystem support than Vite
- **Manual service worker**: Too error-prone, hard to maintain

#### Implementation Pattern
```typescript
// Route-based code splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ZakatCalculator = React.lazy(() => import('./pages/zakat/Calculator'));

// Performance monitoring
import { getCLS, getFID, getFCP, getLCP } from 'web-vitals';

// Service worker with Workbox
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
```

---

### 3. Progressive Web App - Offline & Installation Strategy

#### Decision
Use **Workbox 7** with **Network First for API** + **Cache First for static assets** + **IndexedDB for offline data**

#### Rationale
- **Network First for API calls**:
  - Always try network first for fresh data
  - Fall back to cache when offline
  - Ensures user sees latest Zakat calculations

- **Cache First for static assets**:
  - Instant loading for JS, CSS, images
  - Updates in background (stale-while-revalidate)
  - Reduces bandwidth usage

- **IndexedDB for application data**:
  - Stores user's assets, calculations offline
  - Survives browser restarts
  - Quota management built-in

- **Background Sync**:
  - Queue failed API requests when offline
  - Auto-retry when connection restored
  - Ensures no data loss

#### PWA Checklist
- [x] HTTPS required (production)
- [x] Web app manifest with icons
- [x] Service worker for offline support
- [x] Install prompt handling
- [x] Offline fallback page
- [x] Push notification support (optional)
- [x] Update notification mechanism

#### Alternatives Considered
- **Cache First for everything**: Stale data problem
- **Network Only**: No offline support
- **LocalStorage**: Too limited (5-10MB), synchronous
- **Custom service worker**: Too complex to maintain

#### Implementation Pattern
```typescript
// Workbox routing
registerRoute(
  ({url}) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,
  })
);

registerRoute(
  ({request}) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [new ExpirationPlugin({ maxEntries: 50 })],
  })
);
```

---

### 4. Real User Monitoring - Performance Tracking

#### Decision
Use **web-vitals library** + **custom backend endpoint** + **aggregate metrics in database**

#### Rationale
- **web-vitals library**: Official Google implementation
  - Accurate measurement of Core Web Vitals
  - Matches Search Console data
  - Reports real user experience, not synthetic

- **Custom endpoint**: Privacy-first approach
  - No third-party data sharing
  - Full control over data retention
  - Lightweight (single POST endpoint)

- **Aggregate metrics**: Actionable insights
  - Track P75 (75th percentile) for Core Web Vitals
  - Monitor performance regressions
  - Segment by device, connection, page

#### Alternatives Considered
- **Google Analytics**: Privacy concerns, blocks tracking
- **New Relic**: Expensive, overkill for our needs
- **Sentry Performance**: Good but commercial, extra dependency
- **No monitoring**: Blind to real user experience

#### Data Collection Strategy
```typescript
// Client-side: Report metrics
import { onCLS, onFID, onLCP } from 'web-vitals';

function sendToAnalytics(metric) {
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    body: JSON.stringify(metric),
  });
}

onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onLCP(sendToAnalytics);

// Server-side: Store and aggregate
// Calculate P75, track trends over time
```

---

### 5. Accessibility Testing - Automation & CI Integration

#### Decision
Use **jest-axe** (unit) + **Lighthouse CI** (integration) + **manual screen reader testing** (validation)

#### Rationale
- **Three-layer testing approach**:
  1. **jest-axe**: Catch issues early in component tests
  2. **Lighthouse CI**: Automated audits on every PR
  3. **Manual testing**: Validate real screen reader UX

- **jest-axe**: Component-level validation
  - Runs in existing Jest test suite
  - Fast feedback in development
  - Prevents regressions

- **Lighthouse CI**: Page-level validation
  - Tests entire user flows
  - Blocks PRs with accessibility violations
  - Tracks accessibility score over time

- **Manual screen reader testing**:
  - NVDA (Windows), JAWS (Windows), VoiceOver (Mac/iOS)
  - Validates real user experience
  - Catches context and usability issues

#### CI Pipeline
```yaml
# GitHub Actions workflow
- name: Run accessibility tests
  run: npm run test:a11y

- name: Lighthouse CI
  run: npm run lighthouse:ci
  
- name: Check for violations
  run: |
    if [ $LIGHTHOUSE_ACCESSIBILITY_SCORE -lt 100 ]; then
      exit 1
    fi
```

#### Alternatives Considered
- **Pa11y**: Good but less ecosystem support than axe
- **Manual only**: Too slow, not scalable
- **Automated only**: Misses context-specific issues
- **Wave**: Browser extension, hard to automate

---

### 6. Usability Testing - Methodology & Metrics

#### Decision
Use **moderated remote testing** with **10 participants** testing **3 key tasks** measuring **completion rate** and **satisfaction**

#### Rationale
- **Moderated remote testing**:
  - Observe user behavior and think-aloud protocol
  - Ask clarifying questions in real-time
  - Remote = broader participant pool
  - Screen recording for analysis

- **10 participants**:
  - Nielsen's research: 5 users find 85% of usability issues
  - 10 users = 95% issue discovery
  - Diverse demographics (age, ability, tech literacy)

- **3 key tasks**:
  1. Add assets and calculate Zakat (primary workflow)
  2. View calculation history and track payment
  3. Adjust methodology and understand differences

- **Metrics**:
  - **Task completion rate**: 80%+ target
  - **Time on task**: Benchmark vs. target
  - **Error rate**: Count of user errors
  - **Satisfaction**: SUS score or 5-point scale (target: 4.0+)
  - **Subjective feedback**: Qualitative insights

#### Testing Protocol
1. **Pre-test**: Brief user about purpose (5 min)
2. **Task execution**: Observe and record (15-20 min)
3. **Post-test survey**: SUS + custom questions (5 min)
4. **Analysis**: Tag issues by severity and frequency

#### Alternatives Considered
- **Unmoderated**: Can't probe deeper, miss context
- **In-person**: Expensive, limited geographic reach
- **A/B testing**: Requires high traffic, longer timeline
- **Analytics only**: Shows what, not why

---

## Technology Stack Summary

### New Dependencies

```json
{
  "dependencies": {
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-tooltip": "^1.0.7",
    "react-aria": "^3.31.0",
    "workbox-window": "^7.0.0",
    "web-vitals": "^3.5.0"
  },
  "devDependencies": {
    "@axe-core/react": "^4.8.0",
    "jest-axe": "^8.0.0",
    "vite-plugin-pwa": "^0.17.0",
    "@lhci/cli": "^0.12.0",
    "lighthouse": "^11.0.0"
  }
}
```

### Build & Development Tools
- **Vite 5.x**: Build tool (existing)
- **TypeScript 5.x**: Type safety (existing)
- **Lighthouse CI**: Performance/accessibility audits (new)
- **vite-plugin-pwa**: PWA generation (new)

### Testing Tools
- **Jest**: Unit testing (existing)
- **React Testing Library**: Component testing (existing)
- **jest-axe**: Accessibility testing (new)
- **Lighthouse**: Page-level audits (new)
- **Playwright**: E2E testing (existing)

---

## Implementation Priorities

### Phase 1: Accessibility (Weeks 1-2)
**Goal**: Achieve WCAG 2.1 AA compliance

1. Install Radix UI and react-aria
2. Audit current components with axe-core
3. Fix critical violations (keyboard navigation, ARIA)
4. Add focus indicators and skip links
5. Set up automated accessibility testing

### Phase 2: Performance (Weeks 2-3)
**Goal**: Lighthouse Performance >90, Core Web Vitals "Good"

1. Implement code splitting for routes
2. Add lazy loading for images
3. Optimize bundle with tree-shaking
4. Set up web-vitals monitoring
5. Configure Lighthouse CI

### Phase 3: PWA (Weeks 3-4)
**Goal**: PWA score 100, offline functionality

1. Create web app manifest
2. Implement service worker with Workbox
3. Add offline fallback pages
4. Implement push notifications
5. Test installation flow

### Phase 4: UX Testing (Week 4)
**Goal**: 80%+ task completion, 4.0+ satisfaction

1. Create usability test scenarios
2. Recruit 10 diverse participants
3. Conduct moderated testing sessions
4. Analyze results and iterate
5. Validate improvements

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Service worker caching breaks app | Medium | High | Versioning, update prompts, easy cache clear |
| Performance regression | Low | Medium | Lighthouse CI blocks PRs, monitor with web-vitals |
| Accessibility violations in new features | Medium | High | jest-axe in test suite, CI gates |
| Browser incompatibility | Low | Medium | Target last 2 versions, feature detection |
| Usability testing insights require major changes | Medium | Medium | Test early, iterate, scope reasonably |

---

## Success Criteria Validation

| Requirement | Validation Method | Target | Tool |
|-------------|-------------------|--------|------|
| WCAG 2.1 AA | Automated + Manual | 0 violations | axe, Lighthouse, screen readers |
| Lighthouse Performance | CI audit | >90 | Lighthouse CI |
| Core Web Vitals | RUM | All "Good" (P75) | web-vitals |
| PWA Score | CI audit | 100 | Lighthouse CI |
| Bundle Size | Build analysis | <200KB gzipped | Vite bundle analyzer |
| Task Completion | Usability testing | ≥80% | Manual observation |
| User Satisfaction | Post-test survey | ≥4.0/5.0 | SUS or custom scale |

---

*Research complete. Ready for Phase 1: Design & Contracts.*
