import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  User,
  LoginRequest,
  RegisterRequest,
  API_ENDPOINTS,
} from '@zakapp/shared';

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

  // Check for stored auth on mount and handle demo users
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First, check if there are demo users in the system
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const demoStatusResponse = await fetch(`${baseUrl}/api/v1/auth/demo-status`);
        
        if (demoStatusResponse.ok) {
          const demoData = await demoStatusResponse.json();
          if (demoData.success && demoData.data.hasDemoUsers) {
            console.log('Demo users found in system:', demoData.data.demoUsers);
            
            // Clear any existing auth data if demo users are present
            localStorage.removeItem('zakapp_token');
            localStorage.removeItem('zakapp_user');
            
            // Show startup page instead of auto-login
            setIsLoading(false);
            return;
          }
        }
        
        // Check for stored auth data only if no demo users exist
        const storedToken = localStorage.getItem('zakapp_token');
        const storedUser = localStorage.getItem('zakapp_user');

        if (storedToken && storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            
            // Verify this isn't a demo user
            const isDemoUser = ['john_doe', 'demo', 'demo_user', 'test_user']
              .some(demoUsername => 
                userData.username?.toLowerCase() === demoUsername.toLowerCase()
              );
              
            if (isDemoUser) {
              console.warn('Demo user found in stored auth data. Clearing and showing startup page.');
              localStorage.removeItem('zakapp_token');
              localStorage.removeItem('zakapp_user');
            } else {
              setToken(storedToken);
              setUser(userData);
            }
          } catch (error) {
            // Clear invalid stored data
            localStorage.removeItem('zakapp_token');
            localStorage.removeItem('zakapp_user');
          }
        }
      } catch (error) {
        console.warn('Failed to check demo user status:', error);
        // Continue with normal auth flow if demo check fails
        const storedToken = localStorage.getItem('zakapp_token');
        const storedUser = localStorage.getItem('zakapp_user');

        if (storedToken && storedUser) {
          try {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          } catch (error) {
            localStorage.removeItem('zakapp_token');
            localStorage.removeItem('zakapp_user');
          }
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    try {
      const response = await fetch(`${baseUrl}/api/v1${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      });

      // Always try to parse the JSON response
      const data = await response.json().catch(() => ({ 
        success: false, 
        error: { message: 'Invalid response format' } 
      }));

      // If the request failed but we got a proper error response, return it
      // This allows us to handle API errors gracefully
      if (!response.ok && data.success === false) {
        return data;
      }

      // If the request failed and we don't have a proper error response, throw
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      // Handle network errors or other fetch failures
      if (error instanceof TypeError) {
        throw new Error('Network error - please check your connection');
      }
      throw error;
    }
  };

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await apiCall(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.success) {
        const { user: userData, accessToken: authToken } = response.data;
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
        await login({
          username: userData.username,
          password: userData.password,
        });
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
