import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { isAuthenticationError } from '../services/apiErrors';

/**
 * Global error handler hook for React Query
 * 
 * This hook sets up a global error handler that catches AuthenticationError
 * instances and navigates to the login page using React Router instead of
 * causing a full page reload with window.location.
 * 
 * This maintains SPA behavior and preserves the router state.
 * 
 * Usage:
 * Place this hook in a component that has access to React Router context
 * (e.g., inside BrowserRouter but outside of individual routes)
 */
export const useGlobalErrorHandler = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up a global error handler for all React Query operations
    const defaultOptions = queryClient.getDefaultOptions();
    
    // Save the original onError handlers if they exist
    const originalQueryOnError = defaultOptions.queries?.onError;
    const originalMutationOnError = defaultOptions.mutations?.onError;

    // Set up new error handlers
    queryClient.setDefaultOptions({
      queries: {
        ...defaultOptions.queries,
        onError: (error: any) => {
          // Call original handler if it exists
          if (originalQueryOnError) {
            originalQueryOnError(error);
          }
          
          // Handle authentication errors
          if (isAuthenticationError(error)) {
            // Clear all queries to prevent stale data
            queryClient.clear();
            
            // Navigate to login using React Router (maintains SPA behavior)
            navigate('/login', { replace: true });
          }
        },
      },
      mutations: {
        ...defaultOptions.mutations,
        onError: (error: any) => {
          // Call original handler if it exists
          if (originalMutationOnError) {
            originalMutationOnError(error);
          }
          
          // Handle authentication errors
          if (isAuthenticationError(error)) {
            // Clear all queries to prevent stale data
            queryClient.clear();
            
            // Navigate to login using React Router (maintains SPA behavior)
            navigate('/login', { replace: true });
          }
        },
      },
    });

    // Cleanup: restore original handlers on unmount
    return () => {
      queryClient.setDefaultOptions({
        queries: {
          ...defaultOptions.queries,
          onError: originalQueryOnError,
        },
        mutations: {
          ...defaultOptions.mutations,
          onError: originalMutationOnError,
        },
      });
    };
  }, [navigate, queryClient]);
};
