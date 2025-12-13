import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiService, LoginRequest, RegisterRequest, AuthResponse } from '../services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  register: (userData: RegisterRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();

  // Query for current user
  const {
    data: currentUser,
    isLoading,
    error: userError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await apiService.getCurrentUser();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch user');
      }
      
      return response.data;
    },
    enabled: !!localStorage.getItem('accessToken'),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => apiService.login(credentials),
    onSuccess: (response: AuthResponse) => {
      if (response.success && response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        
        // Set user data in cache
        if (response.user) {
          queryClient.setQueryData(['currentUser'], response.user);
        }
        
        // Refetch current user to ensure consistency
        refetchUser();
      }
    },
    onError: (error: Error) => {
      toast.error('Login failed');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      queryClient.removeQueries({ queryKey: ['currentUser'] });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (userData: RegisterRequest) => apiService.register(userData),
    onSuccess: (response: AuthResponse) => {
      if (response.success && response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        
        // Set user data in cache
        if (response.user) {
          queryClient.setQueryData(['currentUser'], response.user);
        }
        
        // Refetch current user to ensure consistency
        refetchUser();
      }
    },
    onError: (error: Error) => {
      toast.error('Registration failed');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiService.logout(),
    onSuccess: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      queryClient.clear(); // Clear all cached data
    },
    onError: (error: Error) => {
      toast.error('Logout failed');
      // Even if logout fails on server, clear local data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      queryClient.clear();
    },
  });

  // Handle token expiration
  useEffect(() => {
    if (userError && (userError.message.includes('token') || userError?.message.includes('401'))) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      queryClient.removeQueries({ queryKey: ['currentUser'] });
    }
  }, [userError, queryClient]);

  // Auth methods
  const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    const result = await loginMutation.mutateAsync(credentials);
    return result;
  };

  const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
    const result = await registerMutation.mutateAsync(userData);
    return result;
  };

  const logout = async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  };

  const clearError = () => {
    queryClient.setQueryData(['currentUser'], (oldData: any) => oldData);
  };

  const contextValue: AuthContextType = {
    user: currentUser || null,
    isAuthenticated: !!currentUser && !!localStorage.getItem('accessToken'),
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    error: userError?.message || loginMutation.error?.message || registerMutation.error?.message || null,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * HOC to protect routes that require authentication
 */
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }
    
    if (!isAuthenticated) {
      return <div className="flex justify-center items-center min-h-screen">Please log in to access this page.</div>;
    }
    
    return <Component {...props} />;
  };
};