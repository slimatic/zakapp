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
import { getDb, resetDb, closeDb, forceResetDatabase } from '../db';
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

const SESSION_STORAGE_KEY = 'zakapp_session_v1';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session from sessionStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (storedSession) {
          console.log('AuthContext: Found stored session, attempting restore...');
          const { user, jwk } = JSON.parse(storedSession);

          if (user && jwk) {
            await cryptoService.restoreSessionKey(jwk);

            // Initialize DB with the restored key so components can access data
            const keyString = await cryptoService.exportKeyString();
            console.log('AuthContext: Session restored. Key generated (len=' + keyString.length + ')');

            try {
              // Close any existing DB instance first (important for multi-user scenarios)
              await closeDb();
              await getDb(keyString);
              console.log('AuthContext: DB opened successfully with restored key');

              // Verification Step: Check if the session is still valid with the backend
              // This handles cases where the server restarted and invalidated existing tokens.
              try {
                const { apiService: api } = await import('../services/api');
                const verifyResult = await api.getCurrentUser();

                if (verifyResult.success) {
                  console.log('AuthContext: Session verified with backend');
                  dispatch({ type: 'LOGIN_SUCCESS', payload: user });
                } else if (verifyResult.message === 'API Unauthorized (Local Mode)') {
                  // This is the suppressed 401 from api.ts
                  console.warn('AuthContext: Session invalid (401). Clearing stored session.');
                  sessionStorage.removeItem(SESSION_STORAGE_KEY);
                  localStorage.removeItem('accessToken');
                  localStorage.removeItem('refreshToken');
                  dispatch({ type: 'SET_LOADING', payload: false });
                  return; // Don't login
                } else {
                  console.warn('AuthContext: Could not verify session with backend (offline?), continuing in local mode');
                  dispatch({ type: 'LOGIN_SUCCESS', payload: user });
                }
              } catch (verifyError) {
                console.warn('AuthContext: verification call failed, assuming offline mode', verifyError);
                dispatch({ type: 'LOGIN_SUCCESS', payload: user });
              }
            } catch (dbError: any) {
              console.error('AuthContext: DB Open Failed during restore', dbError);

              // Handle Password Mismatch (DB1) - Nuclear Option
              if (dbError?.code === 'DB1' || (dbError?.message && dbError.message.includes('different password'))) {
                console.warn('AuthContext: Pasword mismatch detected (DB1). Nuking local DB to recover...');
                toast.loading('Resetting local database due to security update...', { duration: 3000 });

                // Force delete the old DB
                await forceResetDatabase();

                // Re-initialize with correct key
                await getDb(keyString);
                console.log('AuthContext: DB Re-initialized after nuke.');

                dispatch({ type: 'LOGIN_SUCCESS', payload: user });
              } else {
                throw new Error('Database Open Failed: ' + (dbError instanceof Error ? dbError.message : String(dbError)));
              }
            }
          }
        }
      } catch (error) {
        console.error('AuthContext: Session restore failed', error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        toast.error('Session Restore Failed: ' + errorMsg);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('AuthContext: Attempting login for', email);
    dispatch({ type: 'LOGIN_START' });
    try {
      // 1. Authenticate with Backend API First
      const { apiService: api } = await import('../services/api');
      const apiResult = await api.login({ email, password });

      if (!apiResult.success || !apiResult.user) {
        throw new Error(apiResult.message || 'Login failed');
      }

      // Store access token for sync service
      if (apiResult.accessToken) {
        localStorage.setItem('accessToken', apiResult.accessToken);
      }
      if (apiResult.refreshToken) {
        localStorage.setItem('refreshToken', apiResult.refreshToken);
      }

      // Use the REAL user ID from the backend to lookup local settings
      const backendUserId = apiResult.user.id;
      let userDoc = null;

      // 2. Determine Salt (Prefer API salt to avoid Catch-22 opening locked DB)
      let salt: string;
      const remoteUser = apiResult.user as any;

      if (remoteUser.salt) {
        salt = remoteUser.salt;
        console.log('AuthContext: Retrieved salt from API user object');
      } else if (remoteUser.profile?.salt) {
        salt = remoteUser.profile.salt;
        console.log('AuthContext: Retrieved salt from API profile object');
      } else {
        // Fallback: only if API salt is missing, try to open DB tentatively to get local salt
        // WARNING: This will likely trigger DB1 if DB is already encrypted with derived key
        try {
          await closeDb();
          const db = await getDb(password);
          userDoc = await db.user_settings.findOne(backendUserId).exec();
          if (userDoc && userDoc.get('securityProfile')?.salt) {
            salt = userDoc.get('securityProfile').salt;
            console.log('AuthContext: Retrieved salt from local DB');
          } else {
            throw new Error('Salt missing from both API and local DB');
          }
        } catch (e) {
          console.error('AuthContext: Failed to obtain salt locally', e);
          throw new Error('Encryption salt missing. Database cannot be opened.');
        }
      }

      // 3. Derive Key
      console.log('AuthContext: Deriving key...');
      await cryptoService.deriveKey(password, salt);
      console.log('AuthContext: Key derived successfully');

      // 4. Initialize DB with Derived Key
      const keyString = await cryptoService.exportKeyString();
      let encryptedDb;

      try {
        await closeDb();
        encryptedDb = await getDb(keyString);
      } catch (dbError: any) {
        console.error('AuthContext: DB Open Failed during login', dbError);

        // Handle Password Mismatch (DB1) - Only if we are SURE it's not a key derivation issue
        if (dbError?.code === 'DB1' || (dbError?.message && dbError.message.includes('different password'))) {
          // Force delete the old DB
          await forceResetDatabase();

          // Re-initialize with correct key
          encryptedDb = await getDb(keyString);
          console.log('AuthContext: DB Re-initialized after nuke (Login).');
        } else {
          throw dbError;
        }
      }

      // If Scenario B (Fresh Device or salt retrieved from API), create local user record if it doesn't exist
      userDoc = await encryptedDb.user_settings.findOne(backendUserId).exec();

      if (!userDoc) {
        console.log('AuthContext: Creating local user record for', backendUserId);
        userDoc = await encryptedDb.user_settings.insert({
          id: backendUserId, // Use Real Backend ID
          profileName: apiResult.user.username || 'My Profile',
          email: apiResult.user.email || 'local@device',
          isSetupCompleted: true,
          securityProfile: {
            salt: salt,
            verifier: 'TODO-HASH-OF-KEY'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      const user: User = {
        id: userDoc.get('id'),
        username: userDoc.get('profileName') || 'Local User',
        email: userDoc.get('email') || 'local@device',
        firstName: userDoc.get('firstName') || '',
        lastName: userDoc.get('lastName') || '',
      };

      // 2. Persist Session (Key + User) -> SessionStorage
      const jwk = await cryptoService.exportSessionKey();
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user, jwk }));

      // Note: accessToken already stored in localStorage above

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
      // 1. Generate Security Params
      const salt = (await import('../services/CryptoService')).CryptoService.generateSalt();

      // 2. Derive Key immediately
      await cryptoService.deriveKey(userData.password, salt);

      // Register with backend, passing the salt
      const { apiService: api } = await import('../services/api');
      const apiResult = await api.register({
        ...userData,
        salt: salt // Send salt to backend for multi-device sync
      });

      if (!apiResult.success) {
        throw new Error(apiResult.message);
      }

      // Store access token for sync service
      if (apiResult.accessToken) {
        localStorage.setItem('accessToken', apiResult.accessToken);
      }
      if (apiResult.refreshToken) {
        localStorage.setItem('refreshToken', apiResult.refreshToken);
      }

      if (!apiResult.user || !apiResult.user.id) {
        throw new Error('Registration successful but user ID missing from response');
      }

      const newUserId = apiResult.user.id;

      // 3. Initialize Database with Encryption Key (Derived Key String)
      const keyString = await cryptoService.exportKeyString();

      // Ensure we start with a clean slate (nuke any existing DB leftovers)
      // resetDb() only works if DB is open, so we use forceResetDatabase()
      await forceResetDatabase();

      await getDb(keyString);

      // 4. Create User Profile
      const encryptedDb = await getDb();

      const userDoc = (await encryptedDb.user_settings.insert({
        id: newUserId, // Use Real Backend ID
        profileName: userData.username || 'My Profile',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email,
        isSetupCompleted: true,
        securityProfile: {
          salt: salt,
          verifier: 'TODO-HASH-OF-KEY'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })) as any;

      const user: User = {
        id: newUserId,
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName
      };

      // 4. Persist Session
      const jwk = await cryptoService.exportSessionKey();
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user, jwk }));

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
      cryptoService.clearSession();
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      await closeDb(); // Close connection but keep data!
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