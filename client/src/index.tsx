import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/accessibility.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initPerformanceMonitoring } from './utils/performance';

// Development helper to remove webpack-dev-server overlay which can block E2E interactions
if (process.env.NODE_ENV === 'development') {
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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
