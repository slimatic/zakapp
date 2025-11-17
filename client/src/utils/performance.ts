/**
 * Performance Monitoring Utility
 * 
 * Tracks Core Web Vitals using the web-vitals library and reports
 * metrics to the console (development) or backend endpoint (production).
 * 
 * Core Web Vitals:
 * - CLS (Cumulative Layout Shift): Visual stability - target <0.1
 * - FID (First Input Delay): Interactivity - target <100ms
 * - LCP (Largest Contentful Paint): Loading performance - target <2.5s
 * 
 * Additional Metrics:
 * - FCP (First Contentful Paint): Initial rendering - target <1.5s
 * - TTFB (Time to First Byte): Server responsiveness - target <600ms
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';

const API_ENDPOINT = '/api/analytics/web-vitals';

// Sample rate for production (1 = 100%, 0.1 = 10%)
const SAMPLE_RATE = 0.1;

// Track whether we should report metrics for this session
let sessionShouldReport = false;

/**
 * Determine if this session should report metrics
 * Uses sampling in production to reduce backend load
 */
const shouldReport = (): boolean => {
  if (process.env.NODE_ENV === 'development') {
    return true; // Always report in development
  }
  return Math.random() < SAMPLE_RATE;
};

/**
 * Format metric value based on type
 */
const formatMetricValue = (metric: Metric): string => {
  const value = metric.value;
  
  // CLS is unitless, others are in milliseconds
  if (metric.name === 'CLS') {
    return value.toFixed(3);
  }
  
  return `${Math.round(value)}ms`;
};

/**
 * Get rating for metric value
 */
const getMetricRating = (metric: Metric): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds: Record<string, [number, number]> = {
    CLS: [0.1, 0.25],      // good: <0.1, poor: >0.25
    FID: [100, 300],       // good: <100ms, poor: >300ms
    LCP: [2500, 4000],     // good: <2.5s, poor: >4s
    FCP: [1800, 3000],     // good: <1.8s, poor: >3s
    TTFB: [800, 1800],     // good: <800ms, poor: >1.8s
  };
  
  const [goodThreshold, poorThreshold] = thresholds[metric.name] || [0, 0];
  
  if (metric.value <= goodThreshold) return 'good';
  if (metric.value >= poorThreshold) return 'poor';
  return 'needs-improvement';
};

/**
 * Log metric to console with color-coded rating
 */
const logMetric = (metric: Metric): void => {
  const rating = getMetricRating(metric);
  const value = formatMetricValue(metric);
  
  const colors = {
    good: 'color: #0cce6b',
    'needs-improvement': 'color: #ffa400',
    poor: 'color: #ff4e42',
  };
  
  console.log(
    `%c${metric.name}: ${value} (${rating})`,
    colors[rating]
  );
};

/**
 * Send metric to backend analytics endpoint
 */
const sendMetricToBackend = async (metric: Metric): Promise<void> => {
  try {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: getMetricRating(metric),
      delta: metric.delta,
      id: metric.id,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
    
    // Use sendBeacon if available (more reliable for page unload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(API_ENDPOINT, body);
    } else {
      // Fallback to fetch with keepalive
      fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(err => {
        // Silently fail in production
        console.warn('Failed to send metric to backend:', err);
      });
    }
  } catch (error) {
    // Silently fail - don't break the app for analytics
    console.error('Error sending metric:', error);
  }
};

/**
 * Handle a metric report
 */
const handleMetric = (metric: Metric): void => {
  // Always log in development for visibility in DevTools
  if (process.env.NODE_ENV === 'development') {
    logMetric(metric);
  }
  
  // Send to backend only in production and only for sampled sessions
  if (process.env.NODE_ENV === 'production' && sessionShouldReport) {
    sendMetricToBackend(metric);
  }
};

/**
 * Initialize performance monitoring
 * Call this once when the app loads
 */
export const initPerformanceMonitoring = (): void => {
  // Determine if we should report metrics for this session
  sessionShouldReport = shouldReport();
  
  // In development, always monitor for local debugging
  // In production, only monitor if selected for reporting
  if (!sessionShouldReport && process.env.NODE_ENV !== 'development') {
    return;
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(
      '%c🚀 Performance Monitoring Active',
      'color: #4f46e5; font-weight: bold; font-size: 14px'
    );
    console.log(
      '%cCore Web Vitals Targets: CLS <0.1 | FID <100ms | LCP <2.5s',
      'color: #6b7280; font-size: 12px'
    );
  }
  
  // Register metric handlers
  getCLS(handleMetric);
  getFID(handleMetric);
  getFCP(handleMetric);
  getLCP(handleMetric);
  getTTFB(handleMetric);
};

/**
 * Report all metrics manually (useful for SPA route changes)
 */
export const reportAllMetrics = (): void => {
  getCLS(handleMetric, true);
  getFID(handleMetric);
  getFCP(handleMetric);
  getLCP(handleMetric, true);
  getTTFB(handleMetric);
};

// Export types for use in other modules
export type { Metric } from 'web-vitals';
