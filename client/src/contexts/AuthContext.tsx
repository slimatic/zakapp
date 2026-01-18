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
  recoverData: (oldPassword: string) => Promise<boolean>;
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

  const recoverData = async (oldPassword: string): Promise<boolean> => {
    if (!state.user?.id) return false;

    // We need a toast ID to update progress
    const toastId = toast.loading('Starting recovery...', { duration: Infinity });

    try {
      console.log('Recovery: Starting data recovery process...');

      // 1. Get the salt
      const backendUserId = state.user.id;
      const localSaltKey = `zakapp_salt_${backendUserId}`;
      let salt = localStorage.getItem(localSaltKey);

      // If not in local storage, try to find it in the current user profile (it might be there)
      if (!salt && state.user) {
        // This is tricky potentially, but usually salt is public.
        // Let's assume for this specific recovery flow, the salt IS in local storage 
        // because that's how the current session derived its key too.
        // If it's missing, we are in trouble anyway.
      }

      if (!salt) {
        // Fallback: try to grab from existing user doc if possible (unlikely if encrypted)
        // Or from the API user object if we have it in state
        salt = (state.user as any).salt || (state.user as any).profile?.salt;
      }

      if (!salt) {
        throw new Error('Could not look up your unique security salt. Recovery impossible.');
      }

      // 2. Derive Old Key (Temp)
      toast.loading('Deriving old keys...', { id: toastId });
      const oldKey = await cryptoService.deriveTemporaryKey(oldPassword, salt);

      // 3. Get DB access
      const db = await getDb();

      // Helper to decrypt field
      const tryDecrypt = async (val: any) => {
        if (cryptoService.isEncrypted(val)) {
          const p = cryptoService.unpackEncrypted(val);
          if (p) return await cryptoService.decryptWithKey(p.ciphertext, p.iv, oldKey);
        }
        return val;
      };


      // 4. Migrate Assets
      const assets = await db.assets.find().exec();
      let recoveredCount = 0;
      toast.loading(`Recovering ${assets.length} assets...`, { id: toastId });

      for (const doc of assets) {
        try {
          // Decrypt with OLD key
          const rawName = doc.get('name');
          const rawValue = doc.get('value'); // Might be string if encrypted

          let decryptedName = rawName;
          let decryptedValue = rawValue;

          // Helper to decrypt field - moved to outer scope

          decryptedName = await tryDecrypt(rawName);
          decryptedValue = await tryDecrypt(rawValue);

          // The doc.atomicPatch will automatically re-encrypt using the CURRENT masterKey 
          // because the RxDB schema hooks/wrappers or the simple act of saving 
          // (if our middleware handles it, OR we must explicit re-encrypt?)

          // Wait, RxDB encryption is usually handled by `preInsert`/`preSave` hooks?
          // In this codebase, it looks like we might be relying on explicit service calls?
          // Let's check `CryptoService` usage again.
          // In `login`, we see: `cryptoService.deriveKey`.
          // In `getDb`, we pass the keyString. 
          // If we are using RxDB encryption plugin, it handles it automatically using the key derived at `getDb`.
          // BUT `recoverData` implies the data is ALREADY in the DB but we can't read it.
          // If RxDB handles encryption transparently, then `doc.get('name')` returns DECRYPTED data if key is correct.
          // If key is WRONG (which it is), `doc.get('name')` might throw or return garbage.

          // Wait, the error "Decryption failed" typically comes from the RxDB middleware when it tries to decrypt on fetch.
          // So `db.assets.find().exec()` MIGHT FAIL completely if it tries to decrypt everything on load.

          // If RxDB crashes on `find()`, we can't iterate.
          // This depends on whether the fields are encrypted at the schema level (RxDB encryption) 
          // or app-level (we store strings and manually decrypt).

          // Reviewing schema/code: `schema.prisma` says "Encrypted JSON blob".
          // `CryptoService` has `isEncrypted(data)`.
          // `AuthContext` `login` function has `decryptField` using `cryptoService.decrypt`.
          // This suggests APPLICATION-LEVEL encryption for at least some fields.
          // BUT the error stack trace shows `ea.decrypt` in `index-DynqyD9E.js`, driven by `installHook.js`.

          // If it is Application Level encryption:
          // The data in DB is just a string "ZK1:iv:ciphertext".
          // RxDB `find()` should return the document with that string.
          // The ERROR happens when the UI component renders and calls `decrypt()` on that string using the NEW key.

          // SO `db.assets.find()` SHOULD succeed.
          // And `doc.get('name')` will return the "ZK1:..." string.
          // We can then manually decrypt that string with `oldKey`.
          // And then patch the doc with the CLEARTEXT value.
          // When we `atomicPatch` with cleartext, does it auto-encrypt?
          // In `login` ZK Migration, we see `doc.atomicPatch({ updatedAt: ... })` triggering encryption?
          // No, that migration looked for *cleartext* data and saved it.
          // We need to confirm if there are hooks that encrypt on save.

          // Looking at `AuthContext.ts` lines 420+:
          // "ZK Migration: Scanning for cleartext data..."
          // It finds cleartext, then atomicPatch.
          // This strongly implies there is a `preSave` hook in the RxDB setup that encrypts data if it matches the schema.

          // So our plan:
          // 1. Get encrypted string.
          // 2. Decrypt with OLD KEYS -> Cleartext.
          // 3. atomicPatch({ name: cleartext }). 
          // 4. The DB middleware sees cleartext, encrypts it with CURRENT (NEW) KEY.
          // 5. Success.

          const updates: any = {};
          if (decryptedName !== rawName) updates.name = decryptedName;

          // Value is stored as number in DB usually? Or string?
          // In `login`: `if (doc.get('value') && !cryptoService.isEncrypted(doc.get('value')))` implies it can be encrypted.
          // So we should try to decrypt 'value' too.
          if (decryptedValue !== rawValue) updates.value = decryptedValue;

          if (Object.keys(updates).length > 0) {
            updates.updatedAt = new Date().toISOString();
            await doc.atomicPatch(updates);
            recoveredCount++;
          }

        } catch (e) {
          console.warn('Failed to recover an asset', e);
        }
      }

      // 5. Migrate Payments
      const payments = await db.payment_records.find().exec();
      toast.loading(`Recovering ${payments.length} payments...`, { id: toastId });

      for (const doc of payments) {
        try {
          // Fields: amount, recipientName, notes
          const updates: any = {};

          const processField = async (field: string) => {
            const raw = doc.get(field);
            const dec = await tryDecrypt(raw);
            if (dec !== raw) updates[field] = dec;
          }

          await processField('amount');
          await processField('recipientName');
          await processField('notes');

          if (Object.keys(updates).length > 0) {
            updates.updatedAt = new Date().toISOString();
            await doc.atomicPatch(updates);
          }
        } catch (e) { console.warn('Failed to recovery payment', e); }
      }

      // 6. Migrate Profile (settings are in user_settings collection)
      const userSettings = await db.user_settings.find().exec();
      for (const doc of userSettings) {
        try {
          const updates: any = {};
          const processField = async (field: string) => {
            const raw = doc.get(field);
            const dec = await tryDecrypt(raw);
            if (dec !== raw) updates[field] = dec;
          }
          await processField('firstName');
          await processField('lastName');

          if (Object.keys(updates).length > 0) {
            updates.updatedAt = new Date().toISOString();
            await doc.atomicPatch(updates);
          }
        } catch (e) { }
      }

      toast.success('Recovery complete! Reloading...', { id: toastId });
      setTimeout(() => {
        window.location.reload();
      }, 1500);

      return true;

    } catch (error) {
      console.error('Data Recovery Failed', error);
      toast.error('Recovery failed: ' + (error instanceof Error ? error.message : String(error)), { id: toastId });
      return false;
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
    recoverData,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};