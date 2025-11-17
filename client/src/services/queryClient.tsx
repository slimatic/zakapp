import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { isAuthenticationError, isAuthorizationError } from './apiErrors';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount: number, error: any) => {
        // Don't retry on authentication or authorization errors
        if (isAuthenticationError(error) || isAuthorizationError(error)) {
          return false;
        }
        // Don't retry on 4xx errors (client errors)
        if (error?.statusCode >= 400 && error?.statusCode < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  const [Devtools, setDevtools] = useState<React.ComponentType | null>(null);

  // Error boundary to catch render-time errors from Devtools (prevents webpack overlay)
  class DevtoolsErrorBoundary extends React.Component<{
    children: React.ReactNode;
  }, { hasError: boolean }> {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    componentDidCatch(error: any) {
      // Log devtools render errors but do not rethrow so overlay won't appear
      // eslint-disable-next-line no-console
      console.warn('React Query Devtools threw during render:', error?.message || error);
    }

    render() {
      if (this.state.hasError) return null;
      return this.props.children as React.ReactElement;
    }
  }

  useEffect(() => {
    // Dynamically import devtools to avoid import-time runtime errors in some environments
    let mounted = true;
    // Only attempt to load devtools when explicitly enabled via env var.
    // This prevents unexpected runtime errors (and the webpack overlay) during automated E2E runs.
    if (process.env.REACT_APP_ENABLE_QUERY_DEVTOOLS === 'true') {
      (async () => {
        try {
          const mod = await import('@tanstack/react-query-devtools');
          if (mounted && mod?.ReactQueryDevtools) {
            setDevtools(() => mod.ReactQueryDevtools);
          }
        } catch (err) {
          // Swallow devtools import errors to prevent app overlay in dev server
          // Log for debugging locally
          // eslint-disable-next-line no-console
          console.warn('React Query Devtools failed to load:', err && typeof err === 'object' && 'message' in err ? (err as any).message : err);
        }
      })();
    }
    return () => { mounted = false; };
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {Devtools ? (
        <DevtoolsErrorBoundary>
          <Devtools />
        </DevtoolsErrorBoundary>
      ) : null}
    </QueryClientProvider>
  );
};

export { queryClient };