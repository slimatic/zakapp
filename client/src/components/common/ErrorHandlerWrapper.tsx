import React from 'react';
import { useGlobalErrorHandler } from '../hooks/useGlobalErrorHandler';

/**
 * Error Handler Wrapper Component
 * 
 * This component sets up global error handling for the application.
 * It must be placed inside the Router context but outside of Routes.
 * 
 * It catches AuthenticationError instances from API calls and navigates
 * to the login page using React Router instead of window.location,
 * preserving SPA behavior.
 */
export const ErrorHandlerWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useGlobalErrorHandler();
  return <>{children}</>;
};
