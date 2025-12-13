# Quickstart: Milestone 6 - UI/UX Enhancements

## Prerequisites
- Node.js v20+
- npm v10+

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start Development Server**:
    ```bash
    npm run dev
    ```

## Testing PWA Features

PWA features (Service Worker, Manifest) often require a production build to function correctly.

1.  **Build the Application**:
    ```bash
    npm run build
    ```

2.  **Preview the Build**:
    ```bash
    npm run preview
    ```

3.  **Verify PWA**:
    - Open the application in Chrome.
    - Open DevTools -> Application tab.
    - Check "Manifest" for valid metadata.
    - Check "Service Workers" to see the registered worker.
    - Go "Offline" in the Network tab and refresh to see the fallback page.

## Testing Accessibility

1.  **Manual Testing**:
    - Use the `Tab` key to navigate through the application. Ensure focus is visible and logical.
    - Use a screen reader (e.g., NVDA, VoiceOver) to verify labels.

2.  **Automated Testing**:
    - Run the accessibility audit script (if configured):
        ```bash
        npm run test:a11y
        ```
    - Or use the **axe DevTools** browser extension.

## Performance Auditing

1.  **Lighthouse**:
    - Open Chrome DevTools -> Lighthouse.
    - Select "Mobile" device.
    - Check "Performance", "Accessibility", "Best Practices", "SEO", "PWA".
    - Click "Analyze page load".
