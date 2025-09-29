import { useContext, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../contexts/AuthContext';
import { apiService, LoginRequest, RegisterRequest } from '../services/api';

/**
 * Custom hook for authentication operations
 * Integrates AuthContext with React Query for state management
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  const queryClient = useQueryClient();

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { user, isAuthenticated, login: contextLogin, logout: contextLogout } = context;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await apiService.login(credentials);
      return response;
    },
    onSuccess: (data: any) => {
      console.log('Login mutation onSuccess:', data);
      // Update auth context with user data
      if (data?.success && data?.user && data?.accessToken) {
        // Store tokens in localStorage
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        
        // Convert API response user to shared User interface and update context
        const user = {
          userId: data.user.id,
          username: data.user.username,
          email: data.user.email,
          createdAt: data.user.createdAt,
          lastLogin: new Date().toISOString(),
          preferences: {
            currency: data.user.settings?.currency || 'USD',
            language: 'en',
            zakatMethod: 'standard',
            calendarType: data.user.settings?.preferredCalendar || 'lunar'
          }
        };
        
        // This should trigger the context to update and redirect
        contextLogin(user.email, data.accessToken);
        // Invalidate all queries to refetch with new auth state
        queryClient.invalidateQueries();
      }
    },
    onError: (error: any) => {
      console.error('Login failed:', error);
    }
  });

  // Register mutation  
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterRequest) => {
      const response = await apiService.register(userData);
      return response;
    },
    onSuccess: (data: any) => {
      // Update auth context with user data
      if (data?.user && data?.token) {
        contextLogin(data.user, data.token);
        // Invalidate all queries to refetch with new auth state
        queryClient.invalidateQueries();
      }
    },
    onError: (error: any) => {
      console.error('Registration failed:', error);
    }
  });

  // Logout function
  const logout = useCallback(async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local state
      contextLogout();
      // Clear all cached queries
      queryClient.clear();
    }
  }, [contextLogout, queryClient]);

  // Login function
  const login = useCallback((credentials: LoginRequest) => {
    return loginMutation.mutate(credentials);
  }, [loginMutation]);

  // Register function
  const register = useCallback((userData: RegisterRequest) => {
    return registerMutation.mutate(userData);
  }, [registerMutation]);

  return {
    // State
    user,
    isAuthenticated,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    
    // Errors
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    
    // Actions
    login,
    register,
    logout,
    
    // Mutation objects for advanced use
    loginMutation,
    registerMutation,
  };
};

export type UseAuthReturn = ReturnType<typeof useAuth>;