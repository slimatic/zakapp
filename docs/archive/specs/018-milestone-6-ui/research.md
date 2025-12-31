# Research: Milestone 6 - UI/UX Enhancements

## Accessibility (A11y)

### Standards
- **WCAG 2.1 AA**: The target standard.
- **Key Areas**:
  - **Contrast**: Text vs background ratio > 4.5:1.
  - **Keyboard Navigation**: All interactive elements must be reachable and usable via keyboard.
  - **Screen Readers**: Proper ARIA labels, roles, and semantic HTML.
  - **Focus Management**: Visible focus indicators, focus trapping in modals.

### Tools & Libraries
- **@axe-core/react**: For runtime accessibility checks in development.
- **eslint-plugin-jsx-a11y**: Static analysis for common A11y issues.
- **Lighthouse**: For auditing the final build.

### Implementation Strategy
1.  **Audit**: Run Lighthouse and Axe on all existing pages.
2.  **Remediate**: Fix semantic HTML issues (e.g., `div` as button), add `aria-label` where needed.
3.  **Enhance**: Add "Skip to Content" link, improve focus styles.

## Performance

### Metrics
- **LCP (Largest Contentful Paint)**: < 2.5s (Target < 2.0s).
- **FID (First Input Delay)**: < 100ms.
- **CLS (Cumulative Layout Shift)**: < 0.1.

### Optimization Techniques
- **Code Splitting**: Use `React.lazy` and `Suspense` for route-level splitting.
- **Asset Optimization**: Ensure images are optimized and sized correctly.
- **Bundle Analysis**: Use `rollup-plugin-visualizer` to identify large dependencies.
- **Caching**: Leverage browser caching for static assets (handled by Vite/Nginx).

## Progressive Web App (PWA)

### Requirements
- **Installable**: `manifest.json` with icons, name, start_url.
- **Offline Capable**: Service worker to serve a fallback page when offline.
- **Secure**: Served over HTTPS (already standard).

### Technology: `vite-plugin-pwa`
- **Strategy**: `generateSW` (simplest for this use case) or `injectManifest` (if custom logic needed).
- **Configuration**:
  - `registerType`: 'autoUpdate'.
  - `manifest`: Define theme colors, icons.
  - `workbox`: Configure runtime caching for static assets and offline fallback.

## Usability & Feedback

### Toast Notifications
- **Library**: `react-hot-toast`.
- **Why**: Lightweight (< 5kb), accessible, customizable.
- **Usage**:
  - Success: "Asset saved successfully."
  - Error: "Failed to save asset. Please try again."
  - Loading: "Saving..."

### Loading States
- **Strategy**: Use Skeleton loaders for content areas (e.g., asset lists) and Spinners for button actions.
- **Library**: Custom Tailwind components or `react-loading-skeleton`.

## References
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [React Hot Toast](https://react-hot-toast.com/)
