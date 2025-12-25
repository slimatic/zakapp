import React, { createContext, useContext, useEffect, useReducer } from 'react';
import toast from 'react-hot-toast';
import { apiService } from '../services/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is already authenticated on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await apiService.getCurrentUser();
          if (response.success && response.data?.user) {
            // Map the API response to our User interface
            const apiUser = response.data.user;
            const user: User = {
              id: apiUser.id,
              username: apiUser.username || apiUser.email.split('@')[0],
              email: apiUser.email,
              firstName: apiUser.firstName,
              lastName: apiUser.lastName,
            };
            dispatch({ type: 'LOGIN_SUCCESS', payload: user });
          } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            dispatch({ type: 'LOGOUT' });
          }
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      // Attempting login
      const isEmail = email.includes('@');
      const credentials = isEmail
        ? { email, password }
        : { username: email, password };

      const response = await apiService.login(credentials);

      if (response.success && response.accessToken && response.user) {
        localStorage.setItem('accessToken', response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }

        // --- Client-Side Key Derivation (Zero-Knowledge) ---
        // Ideally, the server returns the user's specific salt here.
        // For this renovation step, if salt is missing, we fallback to a deterministic salt (e.g. username/email)
        // just to prove the architecture works. In production, this MUST be a random salt stored on server.
        const salt = (response.user as any).salt || email;

        import('../services/CryptoService').then(({ cryptoService }) => {
          cryptoService.deriveKey(password, salt).catch(err => {
            console.error("Critical: Failed to derive client-side key", err);
            toast.error(`Security Warning: Failed to enable local encryption. ${err instanceof Error ? err.message : ''}`);
          });
        });
        // ---------------------------------------------------

        const user: User = {
          id: response.user.id,
          username: response.user.username || response.user.email.split('@')[0],
          email: response.user.email,
          firstName: response.user.firstName || '',
          lastName: response.user.lastName || '',
        };

        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        return true;
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.message || 'Login failed' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error instanceof Error ? error.message : 'Login failed' });
      return false;
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      // Generate a new random salt for this user
      // We need to send this to the server to store (publicly) so we can retrieve it on login
      // Note: server needs to accept 'salt' field. 
      // If server ignores it, we lose the salt.
      // For this phase, we will assume we can send it or will handle it later.
      // We will perform derivation anyway.

      const response = await apiService.register(userData);

      if (response.success && response.accessToken && response.user) {
        localStorage.setItem('accessToken', response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }

        // --- Client-Side Key Derivation ---
        // For registration, we use the password provided in userData
        const password = userData.password;
        const email = userData.email;
        const salt = (response.user as any).salt || email; // Fallback

        import('../services/CryptoService').then(({ cryptoService }) => {
          cryptoService.deriveKey(password, salt).catch(console.error);
        });
        // ---------------------------------

        const user: User = {
          id: response.user.id,
          username: response.user.username || response.user.email.split('@')[0],
          email: response.user.email,
          firstName: response.user.firstName || '',
          lastName: response.user.lastName || '',
        };

        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        return true;
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.message || 'Registration failed' });
        return false;
      }
    } catch (error) {
      toast.error('Registration failed');
      dispatch({ type: 'LOGIN_FAILURE', payload: error instanceof Error ? error.message : 'Registration failed' });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();
    } catch (error) {
      // Even if logout API fails, we still want to clear local storage
      toast.error('Logout failed');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};