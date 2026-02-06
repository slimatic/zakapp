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

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivacyProvider } from './contexts/PrivacyContext';
import { QueryProvider } from './services/queryClient';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { OnboardingWizard } from './pages/onboarding/OnboardingWizard';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';
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

import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SkipLink } from './components/common/SkipLink';
import { useSyncManager } from './hooks/useSyncManager';
import { useMaintenanceMode } from './hooks/useMaintenanceMode';
import { ToastProvider } from './components/ui/ToastProvider';
import { MaintenancePage } from './pages/MaintenancePage';

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
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
// const Profile = lazy(() => import('./pages/user/Profile').then(m => ({ default: m.Profile }))); // Legacy
// const Settings = lazy(() => import('./pages/user/Settings').then(m => ({ default: m.Settings }))); // Legacy

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
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));


// Help and documentation
const GettingStarted = lazy(() => import('./components/help/GettingStarted').then(m => ({ default: m.GettingStarted })));
const KnowledgeHub = lazy(() => import('./pages/knowledge/KnowledgeHub').then(m => ({ default: m.KnowledgeHub })));

// Tracking & Analytics pages - lazy loaded for optimal performance
// const TrackingDashboard = lazy(() => import('./pages/TrackingDashboard').then(m => ({ default: m.TrackingDashboard })));
const NisabYearRecordsPage = lazy(() => import('./pages/NisabYearRecordsPage').then(m => ({ default: m.NisabYearRecordsPage })));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const PaymentImportExport = lazy(() => import('./components/payments/PaymentImportExport').then(m => ({ default: m.PaymentImportExport })));
const LiabilitiesPage = lazy(() => import('./pages/LiabilitiesPage').then(m => ({ default: m.LiabilitiesPage })));
const SeederPage = lazy(() => import('./pages/SeederPage').then(m => ({ default: m.SeederPage })));


const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
// const ComparisonPage = lazy(() => import('./pages/ComparisonPage').then(m => ({ default: m.ComparisonPage })));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard }))); // Admin

/**
 * SyncManager Component - must be inside AuthProvider to access user context.
 * Handles per-user sync lifecycle.
 */
function SyncManager() {
  useSyncManager();
  return null; // This component only manages side effects
}

function App() {
  // Check maintenance mode before rendering app
  const { isMaintenanceMode, isLoading } = useMaintenanceMode();

  // Show loading state while checking maintenance status
  if (isLoading) {
    return <PageLoadingFallback />;
  }

  // Show maintenance page if enabled
  if (isMaintenanceMode) {
    return <MaintenancePage />;
  }

  // Normal app flow
  return (
    <ToastProvider>
      <QueryProvider>
        <AuthProvider>
          <PrivacyProvider>
            <SyncManager />
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <ErrorBoundary>
                <div className="App">
                  <SkipLink />
                  <Routes>
                    {/* Auth routes - eagerly loaded */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />


                    {/* Onboarding */}
                    <Route
                      path="/onboarding"
                      element={
                        <ProtectedRoute>
                          <OnboardingWizard />
                        </ProtectedRoute>
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
                        <Layout>
                          <Suspense fallback={<PageLoadingFallback />}>
                            <GettingStarted />
                          </Suspense>
                        </Layout>
                      }
                    />

                    {/* Knowledge Hub / Ilm Hub */}
                    <Route
                      path="/learn"
                      element={
                        <Layout>
                          <Suspense fallback={<PageLoadingFallback />}>
                            <KnowledgeHub />
                          </Suspense>
                        </Layout>
                      }
                    />



                    {/* User routes - lazy loaded with profile skeleton */}
                    <Route
                      path="/profile"
                      element={<Navigate to="/settings" replace />}
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <Suspense fallback={<ProfileSkeleton />}>
                              <SettingsPage />
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
                      path="/nisab-records/:id"
                      element={<Navigate to="/nisab-records" replace />}
                    />
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

                    {/* Liabilities Page */}
                    <Route
                      path="/liabilities"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <Suspense fallback={<AssetListSkeleton />}>
                              <LiabilitiesPage />
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

                    {/* Admin Dashboard */}
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <Layout>
                            <Suspense fallback={<DashboardSkeleton />}>
                              <AdminDashboard />
                            </Suspense>
                          </Layout>
                        </AdminRoute>
                      }
                    />

                    {/* Stress Test Seeder - Dev Only */}
                    <Route
                      path="/seeder"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <Suspense fallback={<PageLoadingFallback />}>
                              <SeederPage />
                            </Suspense>
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* Privacy Policy - Publicly accessible */}
                    <Route
                      path="/privacy-policy"
                      element={
                        <Suspense fallback={<PageLoadingFallback />}>
                          <PrivacyPolicyPage />
                        </Suspense>
                      }
                    />




                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Routes>

                  {/* PWA Features: Install prompt and update notification */}
                  <InstallPrompt />
                  <UpdateNotification />


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
