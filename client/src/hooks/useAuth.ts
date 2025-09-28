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
    onSuccess: (data) => {
      // Update auth context with user data
      contextLogin(data.user, data.token);
      // Invalidate all queries to refetch with new auth state
      queryClient.invalidateQueries();
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
    onSuccess: (data) => {
      // Update auth context with user data
      contextLogin(data.user, data.token);
      // Invalidate all queries to refetch with new auth state
      queryClient.invalidateQueries();
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