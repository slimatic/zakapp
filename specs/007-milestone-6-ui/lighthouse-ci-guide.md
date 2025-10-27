# Lighthouse CI Setup & Audit Guide - Milestone 6

**Purpose**: Automate performance, accessibility, PWA, and SEO audits  
**Standard**: Lighthouse 11+ with CI integration  
**Target Scores**: Performance ≥90, Accessibility 100, PWA 100, Best Practices ≥90, SEO ≥90

---

## 1. Lighthouse CI Configuration

### 1.1 Install Lighthouse CI

```bash
# Install globally
npm install -g @lhci/cli

# Or add to project
npm install --save-dev @lhci/cli
```

### 1.2 Create Configuration File

**File**: `lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "startServerCommand": "npm run build && npx serve -s build -p 3000",
      "startServerReadyPattern": "Accepting connections",
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/login",
        "http://localhost:3000/register",
        "http://localhost:3000/dashboard",
        "http://localhost:3000/assets",
        "http://localhost:3000/calculator",
        "http://localhost:3000/history",
        "http://localhost:3000/settings"
      ],
      "settings": {
        "preset": "desktop",
        "throttling": {
          "rttMs": 40,
          "throughputKbps": 10240,
          "cpuSlowdownMultiplier": 1
        },
        "screenEmulation": {
          "mobile": false,
          "width": 1920,
          "height": 1080,
          "deviceScaleFactor": 1,
          "disabled": false
        }
      }
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 1.0}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}],
        "categories:pwa": ["error", {"minScore": 1.0}],
        
        "first-contentful-paint": ["error", {"maxNumericValue": 1500}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "total-blocking-time": ["error", {"maxNumericValue": 200}],
        "speed-index": ["error", {"maxNumericValue": 3000}],
        
        "viewport": "error",
        "document-title": "error",
        "meta-description": "warn",
        "html-has-lang": "error",
        "html-lang-valid": "error",
        
        "aria-required-attr": "error",
        "aria-valid-attr": "error",
        "button-name": "error",
        "color-contrast": "error",
        "duplicate-id-aria": "error",
        "form-field-multiple-labels": "error",
        "html-has-lang": "error",
        "image-alt": "error",
        "label": "error",
        "link-name": "error",
        "list": "error",
        "listitem": "error",
        "meta-viewport": "error",
        "tabindex": "error",
        
        "installable-manifest": "error",
        "service-worker": "error",
        "splash-screen": "warn",
        "themed-omnibox": "warn",
        "content-width": "error",
        "apple-touch-icon": "warn",
        "maskable-icon": "warn"
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

---

### 1.3 Add NPM Scripts

**File**: `package.json`

```json
{
  "scripts": {
    "lighthouse": "lhci autorun",
    "lighthouse:ci": "lhci autorun --config=lighthouserc.json",
    "lighthouse:desktop": "lighthouse http://localhost:3000 --preset=desktop --view",
    "lighthouse:mobile": "lighthouse http://localhost:3000 --preset=mobile --view",
    "lighthouse:pwa": "lighthouse http://localhost:3000 --only-categories=pwa --view"
  }
}
```

---

## 2. Running Lighthouse Audits

### 2.1 Local Development Audit

**Single Page Audit**:
```bash
# Build the app
npm run build

# Serve the build
npx serve -s build -p 3000

# In another terminal, run Lighthouse
npm run lighthouse:desktop
```

**Full CI Audit**:
```bash
# Runs all pages, 3 times each, with assertions
npm run lighthouse:ci
```

---

### 2.2 CI/CD Integration

**GitHub Actions Workflow** (`~/.github/workflows/lighthouse-ci.yml`):

```yaml
name: Lighthouse CI

on:
  pull_request:
    branches: [main, develop, 007-milestone-6-ui]
  push:
    branches: [main, develop]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci
          cd client && npm ci
      
      - name: Build application
        run: |
          cd client
          npm run build
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          cd client
          lhci autorun --config=lighthouserc.json
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
      
      - name: Upload Lighthouse reports
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: lighthouse-reports
          path: .lighthouseci/
          retention-days: 30
      
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: './client/lighthouserc.json'
          uploadArtifacts: true
          temporaryPublicStorage: true
```

---

## 3. Manual Lighthouse Audit Process

### 3.1 Chrome DevTools Lighthouse

**Steps**:
1. Open the app in Chrome: `http://localhost:3000`
2. Open DevTools: F12 or Ctrl+Shift+I
3. Navigate to "Lighthouse" tab
4. Select categories: Performance, Accessibility, Best Practices, SEO, PWA
5. Select device: Desktop or Mobile
6. Click "Analyze page load"
7. Review report

---

### 3.2 Audit Checklist

**For Each Page**:

| Page | Performance | Accessibility | PWA | Best Practices | SEO | Notes |
|------|-------------|---------------|-----|----------------|-----|-------|
| Landing (/) | ≥90 | 100 | 100 | ≥90 | ≥90 | |
| Login | ≥90 | 100 | 100 | ≥90 | ≥90 | |
| Register | ≥90 | 100 | 100 | ≥90 | ≥90 | |
| Dashboard | ≥90 | 100 | 100 | ≥90 | ≥90 | |
| Assets | ≥90 | 100 | 100 | ≥90 | ≥90 | |
| Calculator | ≥90 | 100 | 100 | ≥90 | ≥90 | |
| History | ≥90 | 100 | 100 | ≥90 | ≥90 | |
| Settings | ≥90 | 100 | 100 | ≥90 | ≥90 | |

**Target**: All scores meet or exceed targets

---

## 4. Performance Budget Enforcement

### 4.1 Performance Metrics Targets

**Core Web Vitals**:
- **FCP** (First Contentful Paint): < 1.5s
- **LCP** (Largest Contentful Paint): < 2.5s
- **CLS** (Cumulative Layout Shift): < 0.1
- **TBT** (Total Blocking Time): < 200ms
- **SI** (Speed Index): < 3.0s

**Bundle Sizes**:
- Main bundle: < 200KB
- Vendor bundle: < 150KB
- CSS bundle: < 30KB
- Total initial load: < 380KB

---

### 4.2 Performance Opportunities to Monitor

**Lighthouse will flag**:
1. Unoptimized images (not WebP, not lazy loaded)
2. Render-blocking resources (CSS/JS)
3. Unused JavaScript (code splitting needed)
4. Unused CSS (PurgeCSS needed)
5. Large DOM size (> 1500 nodes)
6. Long JavaScript tasks (> 50ms)
7. Inefficient cache policy
8. Large network payloads

**Action**: Fix all "red" opportunities before launch

---

## 5. Accessibility Audit Details

### 5.1 Lighthouse Accessibility Checks

**Automated Checks** (Lighthouse runs 40+ audits):

**ARIA**:
- `aria-required-attr`: ARIA roles have required attributes
- `aria-valid-attr`: ARIA attributes are valid
- `aria-allowed-attr`: ARIA attributes are allowed for role
- `aria-valid-attr-value`: ARIA attribute values are valid
- `aria-hidden-body`: `<body>` doesn't have aria-hidden="true"

**Color Contrast**:
- `color-contrast`: Text has sufficient contrast (4.5:1 or 3:1 for large)

**Forms**:
- `label`: Form elements have labels
- `form-field-multiple-labels`: No multiple labels per field
- `button-name`: Buttons have accessible names
- `input-image-alt`: Image buttons have alt text

**Images**:
- `image-alt`: Images have alt text

**Links**:
- `link-name`: Links have discernible text

**Tables**:
- `td-headers-attr`: Table cells reference valid headers
- `th-has-data-cells`: Table headers have data cells

**Structure**:
- `html-has-lang`: `<html>` has lang attribute
- `html-lang-valid`: `<html>` lang is valid BCP 47
- `valid-lang`: lang attributes are valid
- `meta-viewport`: Viewport meta tag is valid
- `document-title`: Page has a title
- `tabindex`: No elements have tabindex > 0

---

### 5.2 Target: 100 Accessibility Score

**Common Issues to Fix**:
1. Missing alt text on images
2. Insufficient color contrast
3. Missing form labels
4. Invalid ARIA attributes
5. Missing page title
6. Missing lang attribute
7. Positive tabindex values
8. Missing link text

---

## 6. PWA Audit Details

### 6.1 Lighthouse PWA Checks

**Installability**:
- `installable-manifest`: Web app manifest is installable
- `service-worker`: Registers a service worker
- `works-offline`: Page loads offline

**PWA Optimized**:
- `splash-screen`: Configured for custom splash screen
- `themed-omnibox`: Address bar matches brand colors
- `content-width`: Content sized correctly for viewport
- `viewport`: Has a viewport meta tag

**Assets**:
- `apple-touch-icon`: Has Apple touch icon
- `maskable-icon`: Has maskable icon for adaptive icons

---

### 6.2 Manifest.json Requirements

**File**: `client/public/manifest.json`

```json
{
  "short_name": "ZakApp",
  "name": "ZakApp - Islamic Zakat Calculator",
  "description": "Privacy-first Islamic Zakat calculator with comprehensive asset management",
  "icons": [
    {
      "src": "icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "icon-maskable-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "icon-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#4F46E5",
  "background_color": "#FFFFFF",
  "orientation": "any",
  "categories": ["finance", "lifestyle", "productivity"],
  "lang": "en-US",
  "dir": "ltr",
  "scope": "/"
}
```

---

### 6.3 Service Worker Requirements

**File**: `client/src/service-worker.js`

Must include:
1. Install event handler (cache static assets)
2. Activate event handler (clean up old caches)
3. Fetch event handler (serve from cache or network)
4. Offline fallback page

---

## 7. Best Practices Audit

### 7.1 Lighthouse Best Practices Checks

**Security**:
- HTTPS usage
- No browser errors in console
- No vulnerable JavaScript libraries
- Uses HTTP/2
- No geolocation on page load
- No notification on page load

**Modern Standards**:
- Uses passive event listeners
- Avoids deprecated APIs
- No document.write()
- Proper image aspect ratios
- Valid source maps

---

## 8. SEO Audit

### 8.1 Lighthouse SEO Checks

**Required**:
- `document-title`: Page has a title
- `meta-description`: Page has meta description
- `http-status-code`: Page has successful HTTP status code
- `font-size`: Text is legible (≥12px)
- `crawlable-anchors`: Links are crawlable
- `robots-txt`: robots.txt is valid
- `hreflang`: hreflang is valid (if applicable)
- `canonical`: Canonical link is valid

---

### 8.2 Meta Tags Required

**File**: `client/public/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#4F46E5" />
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="Privacy-first Islamic Zakat calculator with comprehensive asset management and yearly tracking. Calculate your Zakat accurately using multiple methodologies." />
    <meta name="keywords" content="Zakat calculator, Islamic finance, Zakat, Muslim charity, Islamic calculator" />
    <meta name="author" content="ZakApp" />
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="ZakApp - Islamic Zakat Calculator" />
    <meta property="og:description" content="Privacy-first Islamic Zakat calculator with comprehensive asset management." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://zakapp.example.com" />
    <meta property="og:image" content="https://zakapp.example.com/og-image.png" />
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="ZakApp - Islamic Zakat Calculator" />
    <meta name="twitter:description" content="Privacy-first Islamic Zakat calculator" />
    <meta name="twitter:image" content="https://zakapp.example.com/twitter-card.png" />
    
    <!-- Apple Touch Icon -->
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://zakapp.example.com/" />
    
    <title>ZakApp - Islamic Zakat Calculator</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

---

## 9. Interpreting Results

### 9.1 Score Ranges

**Lighthouse Scores**:
- **90-100**: Good (Green)
- **50-89**: Needs Improvement (Orange)
- **0-49**: Poor (Red)

**Our Targets**:
- Performance: ≥90 (Good)
- Accessibility: 100 (Perfect)
- PWA: 100 (Perfect)
- Best Practices: ≥90 (Good)
- SEO: ≥90 (Good)

---

### 9.2 Common Issues & Fixes

| Issue | Category | Fix |
|-------|----------|-----|
| Large bundle size | Performance | Code splitting, tree shaking |
| Unoptimized images | Performance | WebP format, lazy loading |
| Missing alt text | Accessibility | Add alt attributes |
| Insufficient contrast | Accessibility | Adjust color values |
| Missing manifest | PWA | Create manifest.json |
| No service worker | PWA | Implement service worker |
| Missing meta description | SEO | Add meta tags |
| Render-blocking CSS | Performance | Critical CSS inline |
| Unused JavaScript | Performance | Remove unused imports |

---

## 10. Lighthouse CI Assertions

### 10.1 Assertion Types

**Error** (Fails build):
```json
"categories:accessibility": ["error", {"minScore": 1.0}]
```

**Warning** (Logs warning, doesn't fail):
```json
"meta-description": "warn"
```

**Off** (Ignore):
```json
"some-audit": "off"
```

---

### 10.2 Budget Assertions

```json
{
  "assert": {
    "assertions": {
      "resource-summary:script:size": ["error", {"maxNumericValue": 350000}],
      "resource-summary:stylesheet:size": ["error", {"maxNumericValue": 30000}],
      "resource-summary:image:size": ["warn", {"maxNumericValue": 500000}],
      "resource-summary:total:size": ["error", {"maxNumericValue": 1000000}]
    }
  }
}
```

---

## 11. Reporting & Monitoring

### 11.1 Lighthouse Report Locations

**Local**:
- HTML Report: `.lighthouseci/lh-report-[timestamp].html`
- JSON Data: `.lighthouseci/lh-report-[timestamp].json`

**CI**:
- GitHub Actions Artifacts (30 day retention)
- Temporary Public Storage (7 day retention)

---

### 11.2 Continuous Monitoring

**Tools**:
1. **Lighthouse CI Server** (self-hosted): https://github.com/GoogleChrome/lighthouse-ci
2. **SpeedCurve**: https://speedcurve.com/
3. **Calibre**: https://calibreapp.com/
4. **PageSpeed Insights API**: Daily automated runs

**Recommendation**: Set up Lighthouse CI server for historical tracking

---

## 12. Pre-Launch Checklist

- [ ] All pages score ≥90 Performance
- [ ] All pages score 100 Accessibility
- [ ] All pages score 100 PWA
- [ ] All pages score ≥90 Best Practices
- [ ] All pages score ≥90 SEO
- [ ] No critical errors in console
- [ ] Service worker registered
- [ ] Manifest is installable
- [ ] All images optimized (WebP)
- [ ] Bundle sizes within budget
- [ ] All audits pass in CI
- [ ] Reports reviewed and archived

---

## 13. Task Completion Criteria

**T062: Lighthouse CI Audits** is complete when:
1. ✅ lighthouserc.json configuration created
2. ✅ NPM scripts added to package.json
3. ✅ GitHub Actions workflow created
4. ✅ Manual audits run on all 8 pages
5. ✅ All pages meet target scores:
   - Performance ≥90
   - Accessibility 100
   - PWA 100
   - Best Practices ≥90
   - SEO ≥90
6. ✅ All critical issues fixed
7. ✅ Lighthouse reports archived

---

**Status**: ⏳ Ready to Implement  
**Estimated Time**: 2-3 hours  
**Next Step**: Create lighthouserc.json, add NPM scripts, run audits
