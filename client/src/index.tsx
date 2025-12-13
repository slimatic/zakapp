import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/accessibility.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initPerformanceMonitoring } from './utils/performance';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { initializeBackgroundSync } from './utils/backgroundSync';

// Development helper to remove webpack-dev-server overlay which can block E2E interactions
if (process.env.NODE_ENV === 'development') {
  // Initialize axe-core for accessibility testing
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000);
  }).catch(console.error);

  import('./dev/disableWDSOverlay')
    .then((m) => m.disableWDSOverlay())
    .catch(() => {
      /* ignore */
    });
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialize Core Web Vitals monitoring
initPerformanceMonitoring();

// Initialize background sync for offline requests
initializeBackgroundSync();

// Register service worker for PWA capabilities
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('✅ Service worker registered successfully');
  },
  onUpdate: (registration) => {
    console.log('🔄 New service worker content available');
  },
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
