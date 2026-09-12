/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/accessibility.css';
import App from './App';
import './i18n'; // i18n foundation (#338)
import reportWebVitals from './reportWebVitals';
import { initPerformanceMonitoring } from './utils/performance';
import { initializeBackgroundSync } from './utils/backgroundSync';

// Apply the persisted theme BEFORE first paint. useTheme() consumers only
// exist inside the authed Layout, so pre-auth screens (Login, Create Vault)
// would otherwise never get the `dark` class (#360). Reading localStorage
// here also prevents a light-mode flash on reload for dark-mode users.
try {
  const stored = window.localStorage.getItem('zakapp-theme');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (stored === 'dark' || (stored === null && systemDark)) {
    document.documentElement.classList.add('dark');
  }
} catch {
  // storage/media-query unavailable — default light is fine
}

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

// Register custom service worker (#383)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(() => console.log('[SW] Registered'))
      .catch(err => console.warn('[SW] Registration failed:', err));
  });
}

// Register custom service worker (#383)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(() => console.log('[SW] Registered'))
      .catch(err => console.warn('[SW] Registration failed:', err));
  });
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
