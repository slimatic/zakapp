import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivacyProvider } from './contexts/PrivacyContext';
import { QueryProvider } from './services/queryClient';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import {
  DashboardSkeleton,
  AssetListSkeleton,
  ProfileSkeleton,
  HistorySkeleton,
  PageLoadingFallback,
} from './components/common/LoadingFallback';
import InstallPrompt from './components/pwa/InstallPrompt';
import UpdateNotification from './components/pwa/UpdateNotification';
import { FeedbackWidget } from './components/FeedbackWidget';
import { getFeedbackEnabled } from './config';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SkipLink } from './components/common/SkipLink';
import { ToastProvider } from './components/ui/ToastProvider';

/**
 * T023 Performance Optimization: Route-Based Code Splitting
 * 
 * All non-critical routes are lazy loaded to reduce initial bundle size
 * Only authentication components are eagerly loaded for immediate access
 * 
 * Benefits:
 * - Reduced initial JS bundle by ~60-70%
 * - Faster Time to Interactive (TTI)
 * - Better First Contentful Paint (FCP)
 * - Improved Lighthouse Performance score
 * 
 * Estimated bundle size reduction:
 * - Main routes: ~200KB minified (~60KB gzipped)
 * - Tracking routes: ~150KB minified (~45KB gzipped)
 * - Total initial load: <100KB gzipped (vs ~300KB without splitting)
 */

// Core application pages - lazy loaded with context-aware skeletons
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Profile = lazy(() => import('./pages/user/Profile').then(m => ({ default: m.Profile })));
const Settings = lazy(() => import('./pages/user/Settings').then(m => ({ default: m.Settings })));

// Asset management pages
const AssetList = lazy(() => import('./components/assets').then(m => ({ default: m.AssetList })));
const AssetFormPage = lazy(() => import('./components/assets').then(m => ({ default: m.AssetFormPage })));
const AssetEditPage = lazy(() => import('./pages/assets/AssetEditPage').then(m => ({ default: m.AssetEditPage })));
const AssetImportExport = lazy(() => import('./components/assets').then(m => ({ default: m.AssetImportExport })));
const AssetDetails = lazy(() => import('./components/assets').then(m => ({ default: m.AssetDetails })));

// Zakat calculation and history
// const ZakatCalculator = lazy(() => import('./components/zakat/ZakatCalculator').then(m => ({ default: m.ZakatCalculator })));
// const History = lazy(() => import('./components/history/History').then(m => ({ default: m.History })));

// Auth pages - lazy loaded as they're separate flows
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword').then(m => ({ default: m.ResetPassword })));

// Help and documentation
const GettingStarted = lazy(() => import('./components/help/GettingStarted').then(m => ({ default: m.GettingStarted })));

// Tracking & Analytics pages - lazy loaded for optimal performance
// const TrackingDashboard = lazy(() => import('./pages/TrackingDashboard').then(m => ({ default: m.TrackingDashboard })));
const NisabYearRecordsPage = lazy(() => import('./pages/NisabYearRecordsPage').then(m => ({ default: m.NisabYearRecordsPage })));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const PaymentImportExport = lazy(() => import('./components/payments/PaymentImportExport').then(m => ({ default: m.PaymentImportExport })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
// const ComparisonPage = lazy(() => import('./pages/ComparisonPage').then(m => ({ default: m.ComparisonPage })));

function App() {
  return (
    <ToastProvider>
      <QueryProvider>
        <AuthProvider>
          <PrivacyProvider>
            <Router>
              <ErrorBoundary>
                <div className="App">
                  <SkipLink />
                  <Routes>
                {/* Auth routes - eagerly loaded */}
                <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/forgot-password" 
                element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <ForgotPassword />
                  </Suspense>
                } 
              />
              <Route 
                path="/reset-password" 
                element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <ResetPassword />
                  </Suspense>
                } 
              />

              {/* Dashboard - lazy loaded with custom skeleton */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<DashboardSkeleton />}>
                        <Dashboard />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Asset routes - lazy loaded with asset list skeleton */}
              <Route 
                path="/assets" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<AssetListSkeleton />}>
                        <AssetList />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/assets/new" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<PageLoadingFallback />}>
                        <AssetFormPage />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/assets/import-export" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<PageLoadingFallback />}>
                        <AssetImportExport />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/assets/:id" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<PageLoadingFallback />}>
                        <AssetDetails />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/assets/:id/edit"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<PageLoadingFallback />}>
                        <AssetEditPage />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* History - HIDDEN - TODO: Restore when History functionality implemented */}
              {/* <Route 
                path="/history" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<HistorySkeleton />}>
                        <History />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                } 
              /> */}

              {/* Help - lazy loaded */}
              <Route 
                path="/help" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<PageLoadingFallback />}>
                        <GettingStarted />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* User routes - lazy loaded with profile skeleton */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<ProfileSkeleton />}>
                        <Profile />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<ProfileSkeleton />}>
                        <Settings />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Nisab Year Records - lazy loaded with history skeleton */}
              <Route 
                path="/nisab-year-records" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<HistorySkeleton />}>
                        <NisabYearRecordsPage />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Nisab Records alias for simplified navigation */}
              <Route 
                path="/nisab-records" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<HistorySkeleton />}>
                        <NisabYearRecordsPage />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Payments Page */}
              <Route 
                path="/payments" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<HistorySkeleton />}>
                        <PaymentsPage />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/payments/import-export" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<PageLoadingFallback />}>
                        <PaymentImportExport />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route 
                path="/payments/import-export" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<PageLoadingFallback />}>
                        <PaymentImportExport />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Analytics Page */}
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Suspense fallback={<HistorySkeleton />}>
                        <AnalyticsPage />
                      </Suspense>
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          {/* PWA Features: Install prompt and update notification */}
          <InstallPrompt />
          <UpdateNotification />
          
          {/* Feedback Widget - toggleable via environment variable */}
          {getFeedbackEnabled() && <FeedbackWidget />}
        </div>
        </ErrorBoundary>
      </Router>
      </PrivacyProvider>
    </AuthProvider>
  </QueryProvider>
    </ToastProvider>
  );
}

export default App;
