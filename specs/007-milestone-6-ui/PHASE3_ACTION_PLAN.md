# Phase 3: Performance Optimization - Action Plan

**Status:** Ready to Start  
**Tasks:** T023-T037 (15 tasks)  
**Target:** Core Web Vitals - LCP <2.5s, FID <100ms, CLS <0.1, Lighthouse >90

---

## 🎯 Overview

Phase 3 focuses on **performance optimization** to achieve Google's Core Web Vitals targets. This phase will dramatically improve user experience through:

- **Code Splitting**: Reduce initial bundle size
- **Image Optimization**: Lazy loading + WebP format
- **Bundle Optimization**: Tree-shaking, minification, compression
- **Resource Loading**: Preload critical assets, prefetch next routes
- **React Performance**: Memoization, virtual scrolling
- **Monitoring**: Real-user metrics with web-vitals

---

## 📋 Task Breakdown

### Quick Wins (High Impact, Low Effort) - Start Here! ⚡

**T030: Performance Monitoring** [P]
- Install `web-vitals` package
- Create `client/src/utils/performance.ts`
- Track CLS, FID, FCP, LCP, TTFB
- Send metrics to console (dev) and backend (prod)
- **Impact:** Enables measurement of all improvements
- **Effort:** 15 minutes

**T027: Resource Preloading** [P]
- Add preload links for critical fonts in `index.html`
- Preload above-the-fold images
- Prefetch likely next routes
- **Impact:** Improves FCP and LCP
- **Effort:** 10 minutes

**T028: Font Loading Optimization** [P]
- Add `font-display: swap` to font declarations
- Preload critical fonts
- Use system fonts as fallback
- **Impact:** Reduces CLS and improves FCP
- **Effort:** 10 minutes

---

### Code Optimization (Medium Impact, Medium Effort) 🔧

**T023: Route-Based Code Splitting** [P]
- Use `React.lazy()` for route components
- Add `Suspense` boundaries
- Create loading fallbacks
- **Impact:** Reduces initial bundle by ~40%
- **Effort:** 30 minutes

**T031: React Rendering Optimization** [P]
- Add `React.memo` to expensive components
- Use `useMemo` for calculations
- Use `useCallback` for stable refs
- **Impact:** Improves FID and runtime perf
- **Effort:** 45 minutes

**T029: Loading Skeletons** [P]
- Create `Skeleton.tsx` component
- Add skeletons to Dashboard, Assets, etc.
- Match layout to prevent CLS
- **Impact:** Better perceived performance, reduces CLS
- **Effort:** 30 minutes

---

### Image & Asset Optimization (High Impact, Medium Effort) 🖼️

**T024: Lazy Loading Images** [P]
- Add `loading="lazy"` to all images
- Use Intersection Observer for custom lazy loading
- Add blur-up placeholders
- **Impact:** Improves LCP, reduces bandwidth
- **Effort:** 20 minutes

**T025: WebP Image Optimization** [P]
- Convert images to WebP format
- Provide fallbacks for older browsers
- Compress to <100KB per image
- **Impact:** 30-80% size reduction
- **Effort:** 30 minutes (if images exist)

---

### Build Configuration (Medium Impact, Low Effort) ⚙️

**T026: Bundle Optimization**
- Configure Vite rollup options
- Enable tree-shaking
- Set minify to 'terser'
- Configure chunk splitting
- **Impact:** Reduces bundle size
- **Effort:** 20 minutes

**T033: Asset Compression** [P]
- Enable gzip compression in Vite
- Enable brotli compression
- Configure for JS, CSS, HTML
- **Impact:** 60-80% transfer size reduction
- **Effort:** 15 minutes

**T034: Minimize Render-Blocking Resources** [P]
- Inline critical CSS
- Defer non-critical JS
- Async load third-party scripts
- **Impact:** Improves FCP and LCP
- **Effort:** 25 minutes

---

### Advanced Optimization (High Impact, High Effort) 🚀

**T032: Virtual Scrolling** [P]
- Install `react-window`
- Implement in `AssetList.tsx`
- Handle large datasets (1000+ items)
- **Impact:** Smooth scrolling with large lists
- **Effort:** 45 minutes

---

### Infrastructure (Low Impact, Medium Effort) 📊

**T035: Performance Budgets**
- Create `.lighthouse/budgets.json`
- Set budget limits (script: 200KB, CSS: 50KB, images: 500KB)
- Configure Lighthouse CI to enforce
- **Impact:** Prevents regressions
- **Effort:** 15 minutes

**T036: Analytics Endpoint**
- Create `server/src/routes/web-vitals.ts`
- POST /api/analytics/web-vitals
- Store metrics in database
- **Impact:** Enables production monitoring
- **Effort:** 30 minutes

---

## 🚀 Recommended Execution Order

### Wave 1: Foundation (30 min)
1. **T030** - Performance monitoring setup
2. **T027** - Resource preloading
3. **T028** - Font optimization

### Wave 2: Code Splitting (1 hour)
4. **T023** - Route-based code splitting
5. **T029** - Loading skeletons

### Wave 3: Assets (1 hour)
6. **T024** - Lazy loading images
7. **T025** - WebP optimization (if images exist)

### Wave 4: Build Config (1 hour)
8. **T026** - Bundle optimization
9. **T033** - Asset compression
10. **T034** - Minimize render-blocking resources

### Wave 5: React Optimization (1 hour)
11. **T031** - React rendering optimization
12. **T032** - Virtual scrolling

### Wave 6: Measurement (45 min)
13. **T035** - Performance budgets
14. **T036** - Analytics endpoint
15. **T037** - CHECKPOINT COMMIT

**Total Estimated Time:** ~5-6 hours

---

## 🎯 Target Metrics

### Core Web Vitals
- **LCP (Largest Contentful Paint):** <2.5s (currently unknown)
- **FID (First Input Delay):** <100ms (currently unknown)
- **CLS (Cumulative Layout Shift):** <0.1 (currently unknown)

### Lighthouse Scores (Target: >90)
- **Performance:** >90
- **Accessibility:** 100 (already achieved ✅)
- **Best Practices:** >90
- **SEO:** >90

### Bundle Sizes
- **Initial JS:** <200KB gzipped
- **CSS:** <50KB gzipped
- **Total Page Weight:** <1MB

---

## 📦 Dependencies to Install

```bash
cd client

# Performance monitoring
npm install web-vitals

# Virtual scrolling
npm install react-window @types/react-window

# Vite PWA plugin (for compression & caching)
npm install -D vite-plugin-pwa

# Image optimization (if needed)
npm install -D sharp imagemin imagemin-webp
```

---

## 🧪 Testing Strategy

### Before Starting
```bash
# Run baseline Lighthouse audit
npm run build
npx lighthouse http://localhost:3000 --view

# Note baseline scores:
# - Performance: __
# - LCP: __
# - FID: __
# - CLS: __
```

### After Each Wave
```bash
# Rebuild and test
npm run build
npm run preview

# Quick Lighthouse check
npx lighthouse http://localhost:4173 --only-categories=performance
```

### Final Validation (T037)
```bash
# Full Lighthouse audit
npx lighthouse http://localhost:4173 --view

# Check all metrics meet targets:
# ✅ LCP <2.5s
# ✅ FID <100ms
# ✅ CLS <0.1
# ✅ Performance >90
```

---

## 🎓 Key Concepts

### Core Web Vitals Explained

**LCP (Largest Contentful Paint)**
- Time until largest element is visible
- **Improve:** Code splitting, image optimization, preloading
- **Target:** <2.5s

**FID (First Input Delay)**
- Time from first user interaction to browser response
- **Improve:** Reduce JavaScript execution, use web workers
- **Target:** <100ms

**CLS (Cumulative Layout Shift)**
- Visual stability - how much content shifts during loading
- **Improve:** Size images, reserve space, avoid inserting content
- **Target:** <0.1

---

## 🔗 References

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Performance Scoring](https://web.dev/performance-scoring/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Vite Build Optimizations](https://vitejs.dev/guide/build.html)
- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images)

---

## ✅ Success Criteria

Phase 3 is complete when:
- [ ] All 15 tasks implemented (T023-T037)
- [ ] Lighthouse Performance score >90
- [ ] LCP <2.5s
- [ ] FID <100ms
- [ ] CLS <0.1
- [ ] Bundle size <200KB gzipped
- [ ] Web Vitals monitoring active
- [ ] Performance budgets enforced

---

**Ready to start?** Begin with Wave 1 (Foundation) - it's only 30 minutes and enables measurement of everything else!
