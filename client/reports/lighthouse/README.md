# Lighthouse Performance Reports

This directory contains Lighthouse audit reports for the ZakApp dashboard.

## Running Audits

To run a new Lighthouse audit:

```bash
# From project root
./scripts/lighthouse-audit.sh
```

**Prerequisites:**

- Development server must be running at `http://localhost:3000`
- Lighthouse CLI will be installed automatically if not present

## Report Files

After running the audit, you'll find:

- `dashboard-desktop.report.html` - Desktop audit report (visual)
- `dashboard-desktop.report.json` - Desktop audit data (machine-readable)
- `dashboard-mobile.report.html` - Mobile audit report (visual)
- `dashboard-mobile.report.json` - Mobile audit data (machine-readable)

## Performance Targets

Based on Phase 3.8 (T043) requirements:

| Metric | Target Score | Category |
|--------|--------------|----------|
| Performance | ≥90 | Core Web Vitals, loading speed |
| Accessibility | ≥95 | WCAG 2.1 AA compliance |
| Best Practices | ≥95 | Security, standards compliance |
| SEO | ≥90 | Search engine optimization |

## Performance Budget

The project uses a performance budget defined in `lighthouse-budget.json`:

### Resource Sizes (KB)

- **Total**: 600 KB max
- Scripts: 300 KB max
- Stylesheets: 50 KB max
- Fonts: 100 KB max
- Images: 100 KB max

### Key Metrics

- **First Contentful Paint (FCP)**: ≤2000ms
- **Largest Contentful Paint (LCP)**: ≤2500ms
- **Time to Interactive (TTI)**: ≤3500ms
- **Cumulative Layout Shift (CLS)**: ≤0.1
- **Total Blocking Time (TBT)**: ≤300ms
- **Speed Index**: ≤3000ms

## Interpreting Results

### Performance (90+)

- Fast page load times
- Optimized Core Web Vitals
- Efficient resource delivery
- Minimal JavaScript blocking

### Accessibility (95+)

- WCAG 2.1 AA compliant
- Proper ARIA labels and landmarks
- Sufficient color contrast (4.5:1)
- Touch targets ≥44x44px
- Screen reader compatible

### Best Practices (95+)

- HTTPS enabled
- No console errors
- Optimized images
- Modern APIs used correctly
- Security headers present

## Continuous Monitoring

Run Lighthouse audits:

- Before major releases
- After performance optimizations
- When adding new features
- As part of CI/CD pipeline (future)

## Troubleshooting

### "Dev server is not running"

Start the development server:

```bash
npm run dev
# or
cd client && npm start
```

### Low Performance Scores

Check the HTML report for specific recommendations:

- Image optimization
- JavaScript bundle size
- Render-blocking resources
- Unused CSS/JS
- Third-party scripts

### Low Accessibility Scores

Review accessibility audit details:

- Missing ARIA labels
- Insufficient color contrast
- Small touch targets
- Missing alt text
- Heading hierarchy issues

## Related Documentation

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
- Project: `specs/001-zakapp-specification-complete/spec.md` (Section 5.1.5)
