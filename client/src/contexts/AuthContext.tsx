/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { createContext, useContext, useEffect, useReducer } from 'react';
import toast from 'react-hot-toast';
import type { User } from '../types';
import { authService } from '../services/auth/AuthService';
import { Logger } from '../utils/logger';
import { getDb } from '../db';


const logger = new Logger('AuthContext');




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
  refreshUser: () => Promise<void>;
  updateLocalProfile: (updates: Partial<User>) => Promise<void>;
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

const SESSION_STORAGE_KEY = 'zakapp_session_v1';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session from sessionStorage on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const user = await authService.restoreSession();
        if (user) {
          dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        logger.error('Session restore failed', error);
        toast.error('Session Restore Failed: ' + (error instanceof Error ? error.message : String(error)));
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initSession();
  }, []);


  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const user = await authService.login(email, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return true;
    } catch (error) {
      logger.error('Login error', error);
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error instanceof Error ? error.message : 'Login failed'
      });
      return false;
    }
  };


  const register = async (userData: any): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const user = await authService.register(userData);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return true;
    } catch (error) {
      logger.error('REGISTRATION ERROR:', error);
      toast.error('Registration failed: ' + (error instanceof Error ? error.message : String(error)));
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error instanceof Error ? error.message : 'Registration failed'
      });
      return false;
    }
  };


  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };


  const refreshUser = async (): Promise<void> => {
    try {
      const { apiService: api } = await import('../services/api');
      const verifyResult = await api.getCurrentUser();

      if (verifyResult.success && verifyResult.data?.user) {
        logger.info('User data refreshed from backend');

        let user = verifyResult.data.user;

        // Decrypt fields if they are encrypted (ZK1 prefix)
        const decryptField = authService.decryptField;


        const rawFirstName = (user as any).firstName || '';
        const rawLastName = (user as any).lastName || '';
        const rawUsername = user.username || '';

        const decryptedUser = {
          ...user,
          username: await decryptField(rawUsername),
          firstName: await decryptField(rawFirstName),
          lastName: await decryptField(rawLastName),
        };

        // Merge with local settings (Methodology, Calendar, etc.)
        // This ensures that if the backend is stale or doesn't support a field, we keep our local choice.
        if (state.user?.id) {
          try {
            const db = await getDb();
            const userDoc = await db.user_settings.findOne(state.user.id).exec();
            if (userDoc) {
              const localMethodology = userDoc.get('preferredMethodology');
              if (localMethodology) {
                logger.info(`Overriding backend methodology with local setting: ${localMethodology}`);

              }

              user = {
                ...decryptedUser,
                settings: {
                  ...decryptedUser.settings,
                  preferredMethodology: localMethodology || decryptedUser.settings?.preferredMethodology || 'standard',
                  preferredCalendar: userDoc.get('preferredCalendar') || decryptedUser.settings?.preferredCalendar || 'gregorian',
                  currency: userDoc.get('baseCurrency') || decryptedUser.settings?.currency || 'USD',
                  hijriAdjustment: userDoc.get('hijriAdjustment') ?? decryptedUser.settings?.hijriAdjustment ?? 0
                },
              };
            } else {
              user = decryptedUser;
            }
          } catch (e) {
            logger.warn('Failed to merge local settings in refreshUser', e);

            user = decryptedUser;
          }
        } else {
          user = decryptedUser;
        }

        // Update session storage to persist across reloads
        const currentSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (currentSession) {
          const { jwk } = JSON.parse(currentSession);
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user, jwk }));
        }

        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      } else {
        logger.warn('refreshUser failed - user data missing in response', verifyResult);

      }
    } catch (error) {
    }
  };

  const updateLocalProfile = async (updates: Partial<User>): Promise<void> => {
    if (!state.user?.id) return;
    try {
      const db = await getDb();
      const userDoc = await db.user_settings.findOne(state.user.id).exec();
      if (userDoc) {
        // Prepare patch data by flattening known nested structures
        const patchData: any = { ...updates };

        // Handle 'settings' mapping to flat RxDB schema
        if (updates.settings) {
          if (updates.settings.preferredMethodology) patchData.preferredMethodology = updates.settings.preferredMethodology;
          if (updates.settings.preferredCalendar) patchData.preferredCalendar = updates.settings.preferredCalendar;
          if (updates.settings.currency) patchData.baseCurrency = updates.settings.currency;
          if (typeof updates.settings.hijriAdjustment === 'number') patchData.hijriAdjustment = updates.settings.hijriAdjustment;
          if (updates.settings.preferredNisabStandard) patchData.preferredNisabStandard = updates.settings.preferredNisabStandard;

          // Remove the nested settings object as it violates RxDB schema (VD2 error)
          delete patchData.settings;
        }

        await userDoc.patch({
          ...patchData,
          updatedAt: new Date().toISOString()
        });

        // Update state
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            ...state.user,
            ...updates,
            // We also need to ensure the state reflects the merged settings if we passed partial settings
            settings: {
              ...state.user.settings,
              ...(updates.settings || {})
            }
          }
        });

        // Update session storage
        const currentSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (currentSession) {
          const { jwk } = JSON.parse(currentSession);
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
            user: {
              ...state.user,
              ...updates,
              settings: {
                ...state.user.settings,
                ...(updates.settings || {})
              }
            },
            jwk
          }));
        }
      }
    } catch (error) {
      logger.error('Failed to update local profile', error);

      throw error;
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
    refreshUser,
    updateLocalProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};