import React from 'react';
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  </QueryProvider>
  );
}

export default App;
