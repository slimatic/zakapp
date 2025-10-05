import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QueryProvider } from './services/queryClient';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { AssetList, AssetImportExport, AssetFormPage, AssetDetails } from './components/assets';
import { ZakatCalculator } from './components/zakat/ZakatCalculator';
import { History } from './components/history/History';
import { GettingStarted } from './components/help/GettingStarted';

// T090 Performance Optimization: Lazy load tracking pages for faster initial load
// These pages are not needed until user navigates to them, reducing initial bundle size
// Estimated savings: ~150KB minified (~45KB gzipped) for tracking feature code
const TrackingDashboard = lazy(() => import('./pages/TrackingDashboard').then(m => ({ default: m.TrackingDashboard })));
const SnapshotsPage = lazy(() => import('./pages/SnapshotsPage').then(m => ({ default: m.SnapshotsPage })));
const SnapshotDetailPage = lazy(() => import('./pages/SnapshotDetailPage').then(m => ({ default: m.SnapshotDetailPage })));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage').then(m => ({ default: m.ComparisonPage })));

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
            <Route 
              path="/assets" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <AssetList />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/assets/new" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <AssetFormPage />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/assets/import-export" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <AssetImportExport />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/assets/:id" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <AssetDetails />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/calculate" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <ZakatCalculator />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/history" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <History />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/help" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <GettingStarted />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            {/* Tracking & Analytics Routes - Lazy loaded with Suspense */}
            <Route 
              path="/tracking" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
                      <TrackingDashboard />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tracking/snapshots" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
                      <SnapshotsPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tracking/snapshots/:snapshotId" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
                      <SnapshotDetailPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tracking/payments" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
                      <PaymentsPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tracking/analytics" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
                      <AnalyticsPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tracking/comparison" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
                      <ComparisonPage />
                    </Suspense>
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  </QueryProvider>
  );
}

export default App;
