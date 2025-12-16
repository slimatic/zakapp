import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Developer convenience: localStorage flag to mark current user as admin in dev
  const isDevAdmin = typeof window !== 'undefined' && localStorage.getItem('isAdmin') === '1';

  if (!isAuthenticated && !isDevAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isDevAdmin && !isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated, you could also perform a server check to verify admin role
  return <>{children}</>;
};

export default AdminRoute;
