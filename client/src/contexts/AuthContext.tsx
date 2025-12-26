import React, { createContext, useContext, useEffect, useReducer } from 'react';
import toast from 'react-hot-toast';
import type { User } from '../types';
import { getDb } from '../db';
import { cryptoService } from '../services/CryptoService';

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

const LOCAL_USER_ID = 'local-user-profile';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is already authenticated (session persistence logic could go here)
  useEffect(() => {
    // For now, local-first apps often require login on refresh to re-derive memory keys
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('AuthContext: Attempting login for', email);
    dispatch({ type: 'LOGIN_START' });
    try {
      const db = await getDb();
      console.log('AuthContext: DB acquired');

      const userDoc = await db.user_settings.findOne(LOCAL_USER_ID).exec();
      console.log('AuthContext: User document found?', !!userDoc);

      if (userDoc) {
        console.log('AuthContext: User doc data:', userDoc.toJSON());
      }

      if (!userDoc) {
        throw new Error('No local user found. Please register.');
      }

      const security = userDoc.get('securityProfile');
      if (!security || !security.salt) {
        throw new Error('User profile corrupted. No security data.');
      }

      // 1. Derive Key
      console.log('AuthContext: Deriving key...');
      await cryptoService.deriveKey(password, security.salt);
      console.log('AuthContext: Key derived successfully');

      // 2. Verify Key (simplified: if we derived it, we assume success for this step if we don't have a verifier yet)
      // Ideally check against security.verifier

      const user: User = {
        id: userDoc.get('id'),
        username: userDoc.get('profileName') || 'Local User',
        email: 'local@device', // Placeholder
        firstName: '',
        lastName: '',
      };

      console.log('AuthContext: Dispatching LOGIN_SUCCESS');
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return true;

    } catch (error) {
      console.error('AuthContext: Login error', error);
      dispatch({ type: 'LOGIN_FAILURE', payload: error instanceof Error ? error.message : 'Login failed' });
      return false;
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const db = await getDb();

      // Check if already exists
      const existing = await db.user_settings.findOne(LOCAL_USER_ID).exec();
      if (existing) {
        console.warn('AuthContext: Overwriting existing local user.');
        await existing.remove();
      }

      // 1. Generate Security Params
      const salt = (await import('../services/CryptoService')).CryptoService.generateSalt();

      // 2. Derive Key immediately
      await cryptoService.deriveKey(userData.password, salt);

      // 3. Create User Profile
      await db.user_settings.insert({
        id: LOCAL_USER_ID,
        profileName: userData.username || 'My Profile',
        isSetupCompleted: true,
        securityProfile: {
          salt: salt,
          verifier: 'TODO-HASH-OF-KEY' // Future enhancement
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const user: User = {
        id: LOCAL_USER_ID,
        username: userData.username,
        email: userData.email,
        firstName: '',
        lastName: ''
      };

      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return true;
    } catch (error) {
      console.error('REGISTRATION ERROR:', error);
      alert('REGISTRATION ERROR: ' + (error instanceof Error ? error.message : String(error)));
      toast.error('Registration failed');
      dispatch({ type: 'LOGIN_FAILURE', payload: error instanceof Error ? error.message : 'Registration failed' });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear memory key? Logic for that not exposed in service yet, but simply dropping context user works
    } finally {
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