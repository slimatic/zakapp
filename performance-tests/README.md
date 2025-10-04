# ZakApp Performance Testing Suite

Comprehensive performance testing for ZakApp backend API and frontend application.

## Overview

This directory contains scripts and results for performance testing:
- **API Load Testing**: Using `hey` HTTP load testing tool
- **Frontend Performance**: Using Google Lighthouse for Core Web Vitals

## Prerequisites

- Backend server running on port 3002
- Frontend server running on port 3000
- `hey` tool installed at `/tmp/hey`
- `lighthouse` CLI installed globally (`npm install -g lighthouse`)

## Scripts

### 1. API Load Testing (`run-api-load-tests.sh`)

Tests backend API performance under load:
- Health check baseline
- User registration performance
- User login performance
- Asset management operations
- Zakat calculation performance

**Usage:**
```bash
cd performance-tests
chmod +x run-api-load-tests.sh
./run-api-load-tests.sh
```

**Test Scenarios:**
- Health Check: 1000 requests, 10 concurrent
- User Registration: 500 requests, 5 concurrent
- User Login: 1000 requests, 10 concurrent
- Get Assets: 1000 requests, 10 concurrent
- Create Asset: 500 requests, 5 concurrent
- Zakat Calculation: 500 requests, 5 concurrent

**Expected Metrics:**
- Response Time (p50): < 100ms
- Response Time (p95): < 200ms
- Response Time (p99): < 500ms
- Success Rate: > 99%
- Requests/sec: > 100

### 2. Frontend Performance Testing (`run-frontend-lighthouse.sh`)

Tests frontend performance with Lighthouse:
- Desktop performance audit
- Mobile performance audit
- Performance-only fast check

**Usage:**
```bash
cd performance-tests
chmod +x run-frontend-lighthouse.sh
./run-frontend-lighthouse.sh
```

**Metrics Tested:**
- Performance Score (0-100)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Total Blocking Time (TBT)
- Cumulative Layout Shift (CLS)
- Speed Index

**Target Metrics:**
- Performance Score: > 90
- FCP: < 1.5s
- LCP: < 2.5s
- TBT: < 300ms
- CLS: < 0.1
- Speed Index: < 3.4s

## Results Directory

All test results are saved to `./results/` with timestamps:
- API load test results: `*_YYYYMMDD_HHMMSS.txt`
- Lighthouse HTML reports: `*_YYYYMMDD_HHMMSS.report.html`
- Lighthouse JSON data: `*_YYYYMMDD_HHMMSS.report.json`
- Summary reports: `summary_YYYYMMDD_HHMMSS.txt`

## Running All Tests

To run the complete performance test suite:

```bash
cd performance-tests

# Make scripts executable
chmod +x run-api-load-tests.sh run-frontend-lighthouse.sh

# Run API tests first
./run-api-load-tests.sh

# Run frontend tests
./run-frontend-lighthouse.sh

# View results
ls -la results/
```

## Interpreting Results

### API Load Test Results

Each test output includes:
- **Requests/sec**: Throughput measurement
- **Average**: Mean response time
- **Fastest/Slowest**: Min/max response times
- **95th/99th percentile**: Performance consistency
- **Status code distribution**: Success/error rates

### Lighthouse Results

HTML reports provide:
- Overall performance score (0-100)
- Core Web Vitals metrics
- Opportunities for improvement
- Diagnostics and recommendations
- Resource loading waterfall

## Continuous Monitoring

For production monitoring, consider:
- Setting up automated performance tests in CI/CD
- Using monitoring tools (Datadog, New Relic, etc.)
- Implementing custom performance budgets
- Setting up alerting for performance regressions

## Troubleshooting

### Backend not accessible
```bash
# Check if backend is running
curl http://localhost:3002/health

# Start backend if needed
cd ../server && npm run dev
```

### Frontend not accessible
```bash
# Check if frontend is running
curl http://localhost:3000

# Start frontend if needed
cd ../client && npm start
```

### Permission denied errors
```bash
# Make scripts executable
chmod +x *.sh
```

## Performance Optimization

If tests reveal performance issues:

1. **Backend optimization**:
   - Add database indexes
   - Implement caching (Redis)
   - Optimize queries
   - Use connection pooling

2. **Frontend optimization**:
   - Code splitting
   - Lazy loading
   - Image optimization
   - Bundle size reduction
   - CDN for static assets

## Documentation

- API Specification: `../api-specification.md`
- Implementation Reports: `../FINAL_IMPLEMENTATION_REPORT.md`
- Performance Plan: `../PERFORMANCE_DEPLOYMENT_EXECUTION.md`
