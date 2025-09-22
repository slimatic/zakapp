import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest, API_ENDPOINTS } from '@zakapp/shared';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('zakapp_token');
    const storedUser = localStorage.getItem('zakapp_user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        // Clear invalid stored data
        localStorage.removeItem('zakapp_token');
        localStorage.removeItem('zakapp_user');
      }
    } else {
      // TEMPORARY: Mock authentication for demo
      const mockUser: User = {
        userId: 'demo-user',
        username: 'demo',
        email: 'demo@example.com',
        createdAt: new Date().toISOString(),
        preferences: {
          currency: 'USD',
          language: 'en',
          zakatMethod: 'standard',
          calendarType: 'lunar'
        }
      };
      setUser(mockUser);
      setToken('demo-token');
      localStorage.setItem('zakapp_token', 'demo-token');
      localStorage.setItem('zakapp_user', JSON.stringify(mockUser));
    }
    
    setIsLoading(false);
  }, []);

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${baseUrl}/api/v1${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.error?.message || errorData.message || 'Request failed');
    }

    return response.json();
  };

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await apiCall(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.success) {
        const { user: userData, token: authToken } = response.data;
        setUser(userData);
        setToken(authToken);
        
        // Store in localStorage
        localStorage.setItem('zakapp_token', authToken);
        localStorage.setItem('zakapp_user', JSON.stringify(userData));
      } else {
        throw new Error(response.error?.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    setIsLoading(true);
    try {
      const response = await apiCall(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.success) {
        // Auto-login after successful registration
        await login({ username: userData.username, password: userData.password });
      } else {
        throw new Error(response.error?.message || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('zakapp_token');
    localStorage.removeItem('zakapp_user');
    
    // Optionally call logout endpoint
    if (token) {
      apiCall(API_ENDPOINTS.AUTH.LOGOUT, { method: 'POST' }).catch(() => {
        // Ignore errors on logout
      });
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};